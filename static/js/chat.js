var url = window.location.href;
var room = url.replace(/^(?:\/\/|[^\/]+)*\//, "");
var socket = io();
var isFocused = true;
var unread_messages=0;
var client_username;
var emojisURL = '/static/img/pngs';
var emojiSize = 20;
var emojis = [
		":bowtie:", ":smile:", ":laughing:", ":blush:", ":smirk:", ":kissing_heart:", ":flushed:", ":satisfied:", ":wink:", ":stuck_out_tongue_winking_eye:", 
		":sleeping:", ":worried:", ":open_mouth:", ":confused:", ":weary:", ":disappointed:", ":cry:", ":neutral_face:", ":yum:", ":rage:", ":unamused:",
		":poop:", ":thumbsup:", ":thumbsdown:", ":ok_hand:", ":punch:", ":v:", ":point_up:", ":raised_hands:", ":pray:", ":clap:", ":fu:", ":metal:", ":muscle:", 
		":man_with_turban:", ":100:", ":trollface:"
	],  
	test = /\:[a-z0-9_\-\+]+\:/g;

for (var i = 0; i < emojis.length; i++) {
	var name = String(emojis[i]).slice(1, -1);	
	var url = emojisURL;
    var element = '<img class="emoji" title=":' + name + ':" alt="' + name + '" src="' + url + '/' + encodeURIComponent(name) + '.png"' + (emojiSize ? (' height="' + emojiSize + '"') : '') + ' />';
	$('.dropdown-menu').append(element);
}	

$( ".dropdown-menu img" ).click(function() {
  var emoji = $(this).attr("title");
  var cursorPos = $('#m').prop('selectionStart');
  var v = $('#m').val();
  var textBefore = v.substring(0, cursorPos);
  var textAfter  = v.substring(cursorPos, v.length);
  $('#m').val(textBefore+emoji+textAfter);
  $('#m').focus();
});

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
    var message = $('#m').val().trim();
	if (message != "") {
		socket.emit('send message', message);
	}
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
    message = emoji(message, emojisURL, emojiSize, emojis, test); 
	var element = '<div style="padding: 5px 0px 5px 0px;white-space:normal;">' +'<span style="font-weight:700;">'+username+'</span><p>'+message+'</p></div>';
    $('#messages').append(element);
    $('#messages').stop(true).animate({scrollTop: $('#messages').get(0).scrollHeight}, 0);
    
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