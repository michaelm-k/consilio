var url = window.location.href;
var room = url.replace(/^(?:\/\/|[^\/]+)*\//, "");
var socket = io();

socket.on('connect', function() {
    socket.emit('key or no key', room);
});

socket.on('enter key', function(key) {
    var _key = "";
    while (_key !== key) {
        _key = prompt("Please enter the room's key:");
    }
    socket.emit('key good', room);
});

socket.on('enter username', function() {
    var username = "";
    while (username == null || username.trim() == "" || username.length > 10) {
        username = prompt("Name? (max 10 characters)");
    }
    socket.emit('new user', username, room);
});

socket.on('username is taken', function() {
    alert("That username is taken");
    var username = "";
    while (username == null || username.trim() == "" || username.length > 10) {
        username = prompt("Name? (max 10 characters)");
    }
    socket.emit('new user', username, room);
});

$('form').submit(function() {
    var message = $('#m').val();
    socket.emit('send message', message);
    $('#m').val('');
    $('#m').focus();
    return false;
});

$('#m').keypress(function(e) {
    if (e.which==13) {
        $(this).blur();
        $('form .btn').focus().click();
        $('#m').focus();
        return false;
    }
});

socket.on('new message', function(username, message) {
    if (message.trim() != "") {
        var element = '<div>' +'<b>'+username+':</b> '+message+'<br>'+'</div>' +'<br>';
        $('#messages').append(element);
        $('#messages').stop(true).animate({scrollTop: $('#messages').get(0).scrollHeight}, 0);
    }   
});

socket.on('user joined', function(message) {
    $("body").css("display", "block");
    $('#messages').append($('<li>').text(message));
    $('#messages').stop(true).animate({scrollTop: $('#messages').get(0).scrollHeight}, 0);
});

socket.on('you joined', function(message) {
    $("body").css("display", "block");
    $('#messages').append($('<li>').text(message));
    $('#messages').stop(true).animate({scrollTop: $('#messages').get(0).scrollHeight}, 0);
});

socket.on('user left', function(message) {
    $('#messages').append($('<li>').text(message));
    $('#messages').stop(true).animate({scrollTop: $('#messages').get(0).scrollHeight}, 0);
});

socket.on('update users', function(usernames, numUsers) {
    $('#user_count').empty();
    $('#user_count').append(numUsers);
    $('#users').empty();
    $.each(usernames, function(key, value) {
        $('#users').append('<div>'+key+'</div>');
    });
});