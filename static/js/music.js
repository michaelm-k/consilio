var widgetIframe = document.getElementById('player');
var widget = SC.Widget(widgetIframe);

var page_size=200;

$('#search').keypress(function(e) {
    if (e.which==13) {
        $('#tracks').css('display', 'block');
        var query = $('#search').val();
        $('#tracks').empty();
		$('#tracks').append('<div style="font-weight:700">Loading... Please wait.</div>');

        $.ajax({
            type: 'POST',
            data: {page_size: page_size, query: query},
            url: '/search',						
            success: function(response) {
                var tracks = response.data;
                $('#tracks').empty();
			    if (!jQuery.isEmptyObject(tracks)) {
				    $.each(tracks, function(key, track) {
					   var element='<div><a>'+track.title+'</a></div>';
					   $('#tracks').append(element);  
					   $("#tracks a").last().attr("href", track.permalink_url);
					   $("#tracks a").last().bind('click', false);
				    });
			     } else {
				    $('#tracks').append('<div style="font-weight:700">Nothing matched your search. Try again?</div>');
			     }
            },
            error: function() {
                $('#tracks').empty();
                $('#tracks').append('<div style="font-weight:700">Shit, something went wrong. Try again later.</div>'); 
            }
        });
    }
});

document.addEventListener('click', function (event) {
    var anchor = event.target.closest("a");
    if (anchor) {
        socket.emit('new song', anchor.getAttribute('href'));
    }   
}, true);


socket.on('update song', function(url) {   
    widget.load(url, {color: "ff0066", auto_play:true});
});
