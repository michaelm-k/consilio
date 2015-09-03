var socket = io();

socket.on('connect', function(){
    username = "";
    while (username == null || username.trim() == "" || username.length > 10) {
        username = prompt("Name? (max 10 characters)");
    }
    $("body").css("display", "block");
    socket.emit('new user', username);
});

$('form').submit(function(){
    var message = $('#m').val();
    socket.emit('send message', message);
    $('#m').val('');
    return false;
});

socket.on('new message', function(username, message) {
    if (message.trim() != "") {
        var element = '<b>'+username+':</b> '+message+'<br>'+'<i>'+jQuery.timeago(new Date())+'</i>'+'<br>';
        $('#messages').append(element);
    }   
});

socket.on('user joined', function(message) {
    $('#messages').append($('<li>').text(message));
});

socket.on('user left', function(message) {
    $('#messages').append($('<li>').text(message));
});

socket.on('update users', function(usernames, numUsers) {
    $('#user_count').empty();
    $('#user_count').append(numUsers);
    $('#users').empty();
    $.each(usernames, function(key, value) {
        $('#users').append('<div>'+key+'</div>');
    });
});