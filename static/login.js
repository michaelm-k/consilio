var username = "";
var socket = io();

while (username.trim() == "") {
    username = prompt("Please enter your name", "Joe Blow");
}

if (username == null) {
    
} else {
    window.location.href = "/";
    socket.emit('new user', username);
}
