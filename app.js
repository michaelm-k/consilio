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

var room_numbers = {}; // empty object of all room numbers
var numUsers=0;
var sockets = [];

function findRoomByRoomNumber(room_number) {
    if (room_numbers.hasOwnProperty(room_number)) {
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
         res.render("vacant");
    }
});

app.post('/rooms/new', function (req, res) {
    var room_number = req.body.room_number;
    var key = req.body.key;
    room_numbers[room_number] = room_number;
    res.redirect('/' + room_number);   
});

function countUsersInRoom(roomName) {
    var room = io.sockets.adapter.rooms[roomName];
    if (!room) return null;
    return Object.keys(room).length;
}

function getUsersInRoom(roomName) {
    var roomMembers = [];
    var room = io.sockets.adapter.rooms[roomName];
    for(var clientID in room) {
        roomMembers.push(io.sockets.connected[clientID]);
    }
    return roomMembers;
}

io.on('connection', function(socket){   
    socket.on('send message', function(message) {
        io.to(socket.room).emit('new message', socket.username, message);
    });
    
    socket.on('new user', function(username, room) {
        socket.username = username;
        socket.room = room;
        socket.join(room);
        
        numUsers = countUsersInRoom(socket.room);
        sockets.push(socket);
        
        var usernames={};
        for(var i = 0; i < sockets.length; i++) {
            if (sockets[i] !== null && sockets[i].room==socket.room) {
                var username=sockets[i].username;
                usernames[username]=username;
            }
        }

        socket.emit('user joined', 'welcome, ' + username, numUsers);
        socket.broadcast.to(socket.room).emit('user joined', username + ' joined', numUsers);
        
        io.to(room).emit('update users', usernames, numUsers);
    });
    
    socket.on('new song', function(url) {
        io.to(socket.room).emit('update song', url);
    });
    
    socket.on('disconnect', function() {
        socket.leave(socket.room);
       // delete usernames[socket.username];
        for(var i = 0; i < sockets.length; i++) {
            if (sockets[i] !== null && sockets[i].username==socket.username) {
                sockets.splice(i);
            }
        }
        var usernames={};
        for(var i = 0; i < sockets.length; i++) {
            if (sockets[i] !== null && sockets[i].room==socket.room) {
                var username=sockets[i].username;
                usernames[username] = username;
            }
        }
        numUsers = countUsersInRoom(socket.room);
        if (numUsers==null && socket.room!=='lobby') {
            delete room_numbers[socket.room];
        } else {
            socket.broadcast.to(socket.room).emit('user left', socket.username + ' left');
            io.to(socket.room).emit('update users', usernames, numUsers);
        }       
    });   
});

var run_server = server.listen(port, function () {
  var host = run_server.address().address;
  var port = run_server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});