var socket = io();

socket.on('connect', function() {
    socket.emit('get public rooms');
});

socket.on('update public rooms', function(public_rooms, numUsersInPublicRooms) {
    $('#public_rooms').empty();
    $.each(public_rooms, function(key, value) {
		if (typeof numUsersInPublicRooms[key] !== 'undefined') {
			$('#public_rooms').append('<div>'+'<a>'+key+'</a>'+' (' + numUsersInPublicRooms[key] + ')' + '</div>');
			$("#public_rooms a").last().attr("href",'/'+key);
		}    
    });
});

$("body").css("display", "block");

$('#create_room').click(function() {
    if ($('#public').is(':checked')) { 
        document.getElementById("key").required = false;
    } else if ($('#private').is(':checked')) {
         document.getElementById("key").required = true;  
    }
});

$('#private').click(function() {
   $("#enter_key").css("display", "inline");
});

$('#public').click(function() {
   $("#enter_key").css("display", "none");
});

$("#form-create_room").submit(function(e) {
    $.ajax({
        url : $(this).attr("action"),
        type: $(this).attr("method"),
        data : $(this).serialize(),
        success:function(response) {
			if (response.message) {
				alert(response.message);
			} else if (response.room_number) {
				window.location.replace("/" + response.room_number);
			} else {
				alert('Whoops! You may wanna try that again.'); 
			}	
        },
        error: function() {
            alert('Whoops! You may wanna try that again.');     
        }
    });
    e.preventDefault();
});