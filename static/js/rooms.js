var socket = io();

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

socket.on('connect', function() {
    socket.emit('get public rooms');
});

socket.on('update public rooms', function(public_rooms, numUsersInPublicRooms) {
    $('#public_rooms').empty();
    $.each(public_rooms, function(key, value) {
        $('#public_rooms').append('<div>'+'<a>'+key+'</a>'+' (' + numUsersInPublicRooms[key] + ')' + '</div>');
        $("#public_rooms a").last().attr("href",'/'+key);
    });
});