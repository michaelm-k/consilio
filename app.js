var express = require('express');
var http = require('http');
var app = express();
var port = 3700;
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/static'));

app.get('/login', function (req, res) {
  res.render("login");
});

app.get('/', function (req, res) {
  res.render("chat");
});

var usernames = {};
var numUsers = 0;

io.on('connection', function(socket){
    var addedUser = false;
    
    socket.on('send message', function(message) {
        io.emit('new message', socket.username, message);
    });
    
    socket.on('new user', function(username) {
        socket.username = username;
        
        usernames[username] = username;
        ++numUsers;
        addedUser = true;
        
        socket.emit('user joined', 'welcome, ' + username, numUsers);
        socket.broadcast.emit('user joined', username + ' joined', numUsers);
        
        io.emit('update users', usernames, numUsers);
    });
    
    /*  
    socket.on('typing', function() {
        io.emit('typing', {
            username: socket.username
        });
    });        */ 
    
    socket.on('disconnect', function() {
        if (addedUser) {
            socket.broadcast.emit('user left', socket.username + ' left');
            
            delete usernames[socket.username];
            --numUsers;
                
            io.emit('update users', usernames, numUsers);
        }
    });   
});

var run_server = server.listen(port, function () {
  var host = run_server.address().address;
  var port = run_server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});