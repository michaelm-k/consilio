var socket = io();

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