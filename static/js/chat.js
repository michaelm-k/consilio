var url = window.location.href;
var room = url.replace(/^(?:\/\/|[^\/]+)*\//, "");
var socket = io();
var isFocused = true;
var unread_messages=0;
var client_username;

function onFocus(){
    isFocused = true;
};

function onBlur() {
    isFocused = false;
};

window.onfocus = onFocus;
window.onblur = onBlur;

socket.on('connect', function() {
    socket.emit('key or no key', room);
});

socket.on('enter key', function() {
    var key = prompt("Please enter the room's key:");
    socket.emit('verify key', room, key);
});

socket.on('enter username', function(usernameTaken) {
    if (usernameTaken) {
		alert("That username is taken");
	}
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

socket.on('new message', function(username, message, room) {
	message = message.trim();
    if (message != "") {
        var element = '<div style="padding: 5px 0px 5px 0px;">' +'<span style="font-weight:700;padding-right:15px;">'+username+'</span><span>'+message+'</span></div>';
        $('#messages').append(element);
        $('#messages').stop(true).animate({scrollTop: $('#messages').get(0).scrollHeight}, 0);
    }   
    
    if (!isFocused) {    
        ++unread_messages;
        if (room=='lobby') {
            document.title = '('+unread_messages+') '+ 'LOBBY | CONSIL.IO';
        } else {
            document.title = '('+unread_messages+') '+'ROOM '+room + ' | CONSIL.IO';
        }
    }

    window.onfocus = function() {
        isFocused=true;
        unread_messages=0;
        if (room=='lobby') {
            document.title = 'LOBBY | CONSIL.IO';
        } else {
            document.title = 'ROOM '+room + ' | CONSIL.IO';
        }
    }
});

socket.on('user joined', function(youJoined, message, username) {
	var element = '<li>';
	$("body").css("display", "block");
	if (youJoined) {
		client_username = username;
	}
	$('#messages').append($(element).text(message));   
    $('#messages').stop(true).animate({scrollTop: $('#messages').get(0).scrollHeight}, 0);
});

socket.on('user left', function(message) {
    $('#messages').append($('<li>').text(message));
    $('#messages').stop(true).animate({scrollTop: $('#messages').get(0).scrollHeight}, 0);
});

socket.on('update users', function(usernames, numUsers) {
    $('#users_count').empty();
    $('#users_count').append(numUsers);
    $('#users').empty();
    $.each(usernames, function(key, value) {
        if (key==client_username) {
            $('#users').append('<div>'+'<b>'+key+'</b>'+'</div>');
        } else {
            $('#users').append('<div>'+key+'</div>');
        }
    });
});