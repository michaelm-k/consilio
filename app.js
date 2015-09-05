var express = require('express');
var bodyParser = require('body-parser')
var http = require('http');
var sio = require('socket.io');
var app = express();
var port = process.env.PORT || 5000;
var server = http.createServer(app);

var io = sio.listen(server);

app.use(bodyParser());

app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.use("/static", express.static(__dirname + '/static'));

var rooms = {}; // empty object of all room numbers
var numUsers=0;
var sockets = [];
var keys={};

function findRoomByRoomNumber(room_number) {
    if (rooms.hasOwnProperty(room_number)) {
        return true;
    }
    return false;
}
  
app.get('/lobby', function (req, res) {
    res.render("chat");
});

app.get('/', function (req, res) {
    res.render("rooms");
});

app.get('/:room', function (req, res) {
    var room_number = req.params.room;
    if (findRoomByRoomNumber(room_number)) {
        res.render("chat"); 
    } else {
         res.render("rooms");
    }
});

app.post('/rooms/new', function (req, res) {
    var room_number = req.body.room_number;
    var key = req.body.key;
    if (!(findRoomByRoomNumber(room_number))) {
        rooms[room_number] = room_number;
        if (key) {
            keys[room_number]=key;
        } else {
            if (keys.hasOwnProperty(room_number)) {
                delete keys[room_number];
            }          
        }
         res.redirect('/' + room_number); 
    } else {
         res.redirect('/'); 
    }   
});

function countUsersInRoom(roomName) {
    var room = io.sockets.adapter.rooms[roomName];
    if (!room) return null;
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
            
            if (!(rooms.hasOwnProperty(room))) {
                rooms[room] = room;
            }
        
            numUsers = countUsersInRoom(room);
            sockets.push(socket);
        
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
        if (numUsers==null && socket.room!='lobby') {
            delete rooms[socket.room];
        } else {
            if (numUsers!=null) {
                socket.broadcast.to(socket.room).emit('user left', socket.username + ' left');
                io.to(socket.room).emit('update users', usernames, numUsers);
            }
        }       
    });   
});

var run_server = server.listen(port, function () {
  var host = run_server.address().address;
  var port = run_server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});