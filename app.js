var express = require('express');
var bodyParser = require('body-parser');
//var session = require('express-session');
//var cookieParser = require('cookie-parser');
//var flash = require('connect-flash');
var http = require('http');
var sio = require('socket.io');
var SC = require('node-soundcloud'); // https://www.npmjs.com/package/node-soundcloud

var app = express();
var port = process.env.PORT || 5000;
var server = http.createServer(app);
var io = sio.listen(server);

app.use(bodyParser());

//app.use(cookieParser('secret'));
//app.use(session({cookie: { maxAge: 60000 }}));
//app.use(flash());

app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.use("/static", express.static(__dirname + '/static'));

if (!process.env.NODE_ENV) {
	require('./env.js');
}

SC.init({
  id: process.env.CLIENT_ID
});

var room_numbers = {}; // empty object of all room numbers
var numUsers=0;
var sockets = [];
var keys={};
var public_rooms = {};
public_rooms['lobby']='lobby';
var numUsersInPublicRooms = {};
numUsersInPublicRooms['lobby']=0;

function isRoomNumberOccupied(room_number) {
    if (room_numbers.hasOwnProperty(room_number)) {
        return true;
    }
    return false;
}

app.get('/', function (req, res) {
    res.render("rooms");
});

app.get('/please_upgrade', function (req, res) {
    res.render("please_upgrade");
});

app.get('/lobby', function (req, res) {
    res.render("chat", {title: 'LOBBY'});
});

app.post('/search', function (req, res) {
    SC.get('/tracks', { limit: req.body.page_size, q: req.body.query }, function(err, tracks) {
        if (err) console.log(err);
        console.log(tracks);
        res.json({data:tracks});
    });
});

app.get('/:room', function (req, res) {
    var room_number = req.params.room;
    if (isRoomNumberOccupied(room_number)) {
        res.render("chat", {title: 'ROOM '+ room_number}); 
    } else {
         res.render("rooms");
    }
});

app.post('/rooms', function (req, res) {
    var room_number = req.body.room_number;
    var key = req.body.key;
	var room_type = req.body.room_type;
    if (countUsersInRoom(room_number)==0) {
        room_numbers[room_number] = room_number;
        if (room_type=="private") {
            keys[room_number]=key;
        } else {
            if (keys.hasOwnProperty(room_number)) {
                delete keys[room_number];
            }          
        }
		//res.redirect('/' + room_number); 
        res.json({room_number: room_number});
    } else {
         //req.flash('info', "That room is taken");
         //res.render('rooms', {message: req.flash('info')});
		 res.json({message: "That room is taken"});
    }   
});

function countUsersInRoom(roomName) {
    var room = io.sockets.adapter.rooms[roomName];
    if (!room) return 0;
    return Object.keys(room).length;
}

function usernameExistsInRoom(username, room) {
    for (var i=0;i<sockets.length;i++) {
        if (typeof sockets[i] != "undefined" && sockets[i].room==room && sockets[i].username==username) {
            return true;
        }
    }
    return false;
}

io.on('connection', function(socket){      
    socket.on('key or no key', function(room) {
        if (keys.hasOwnProperty(room)) {
            socket.emit('enter key');
        } else {
            socket.emit('enter username', false);
        }
    });
    
	socket.on('verify key', function(room, key) {
		if (key==keys[room]) {
			socket.emit('enter username', false);
		} else {
			socket.emit('enter key');
		}
	});
    
    socket.on('new user', function(username, room) {
        if (!(usernameExistsInRoom(username, room))) {
            socket.username = username;
            socket.room = room;
            socket.join(room);
            sockets.push(socket);
            numUsers = countUsersInRoom(room);
            if (!(public_rooms.hasOwnProperty(room)) && !(keys.hasOwnProperty(room))) {
                public_rooms[room]=room;                
            }     
            if (public_rooms.hasOwnProperty(room)) {
                numUsersInPublicRooms[room] = numUsers;
                io.emit('update public rooms', public_rooms, numUsersInPublicRooms);
            }
            var usernames={};
            for(var i = 0; i < sockets.length; i++) {
                if (typeof sockets[i] != "undefined" && sockets[i].room==socket.room) {
                    var username=sockets[i].username;
                    usernames[username]=username;
                }
            }
            socket.emit('user joined', true, 'welcome, ' + username, username);
            socket.broadcast.to(socket.room).emit('user joined', false, username + ' joined', username); 
            io.to(room).emit('update users', usernames, numUsers);
        } else {
            socket.emit('enter username', true);
        }
    });
    
    socket.on('send message', function(message) {
        io.to(socket.room).emit('new message', socket.username, message, socket.room);
    });
    
    socket.on('new song', function(url) {
        io.to(socket.room).emit('update song', url);
    });
    
    socket.on('disconnect', function() {
        socket.leave(socket.room);

        for(var i = 0; i < sockets.length; i++) {
            if (typeof sockets[i] != "undefined" && sockets[i].username==socket.username && sockets[i].room==socket.room) {
                delete sockets[i];
            }
        }
        var usernames={};
        for(var i = 0; i < sockets.length; i++) {
            if (typeof sockets[i] != "undefined" && sockets[i].room==socket.room) {
                var username=sockets[i].username;
                usernames[username] = username;
            }
        }
        numUsers = countUsersInRoom(socket.room);
        if (numUsers==0 && socket.room!='lobby') {
            delete room_numbers[socket.room]; // 'cause 'lobby' doesn't exist in rooms_numbers
        } else {
            if (numUsers!=0) {
                socket.broadcast.to(socket.room).emit('user left', socket.username + ' left');
                io.to(socket.room).emit('update users', usernames, numUsers);
            }
        }  
        if (public_rooms.hasOwnProperty(socket.room)) {
            numUsersInPublicRooms[socket.room]=numUsers;
            if (socket.room!='lobby' && numUsers==0) {
                delete public_rooms[socket.room];
                delete numUsersInPublicRooms[socket.room];
            }
            io.emit('update public rooms', public_rooms, numUsersInPublicRooms);
        }
    });  
    
    socket.on('get public rooms', function() {
        socket.emit('update public rooms', public_rooms, numUsersInPublicRooms);
    });
});

var run_server = server.listen(port, function () {
  var host = run_server.address().address;
  var port = run_server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});