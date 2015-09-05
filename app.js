var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var http = require('http');
var sio = require('socket.io');
var app = express();
var port = process.env.PORT || 5000;
var server = http.createServer(app);

var io = sio.listen(server);

app.use(bodyParser());
app.use(cookieParser('secret'));
app.use(session({cookie: { maxAge: 60000 }}));
app.use(flash());

app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.use("/static", express.static(__dirname + '/static'));

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
  
app.get('/lobby', function (req, res) {
    res.render("chat", {title: 'LOBBY'});
});

app.get('/', function (req, res) {
    res.render("rooms");
});

app.get('/:room', function (req, res) {
    var room_number = req.params.room;
    if (isRoomNumberOccupied(room_number)) {
        res.render("chat", {title: 'ROOM '+ room_number}); 
    } else {
         res.render("rooms");
    }
});

app.post('/rooms/new', function (req, res) {
    var room_number = req.body.room_number;
    var key = req.body.key;
    if (!(isRoomNumberOccupied(room_number))) {
        room_numbers[room_number] = room_number;
        if (key) {
            keys[room_number]=key;
        } else {
            if (keys.hasOwnProperty(room_number)) {
                delete keys[room_number];
            }          
            public_rooms[room_number] = room_number;
        }
         res.redirect('/' + room_number); 
    } else {
         req.flash('info', "That room is taken");
         res.render('rooms', {message: req.flash('info')});
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
            socket.emit('enter key', keys[room]);
        } else {
            socket.emit('enter username');
        }
    });
    
    socket.on('key good', function() {
        socket.emit('enter username');
    });
    
    socket.on('new user', function(username, room) {
        if (!(usernameExistsInRoom(username, room))) {
            socket.username = username;
            socket.room = room;
            socket.join(room);
            sockets.push(socket);
            numUsers = countUsersInRoom(room);
            
            if (!(room_numbers.hasOwnProperty(room)) && room!='lobby') {
                room_numbers[room] = room;
            }
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

            socket.emit('you joined', 'welcome, ' + username, numUsers);
            socket.broadcast.to(socket.room).emit('user joined', username + ' joined', numUsers); 
            io.to(room).emit('update users', usernames, numUsers);
        } else {
            socket.emit('username is taken');
        }
    });
    
    socket.on('send message', function(message) {
        io.to(socket.room).emit('new message', socket.username, message);
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