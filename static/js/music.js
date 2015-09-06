SC.initialize({
  client_id: "process.env['CLIENT_ID']"
});

var widgetIframe = document.getElementById('player');
var widget = SC.Widget(widgetIframe);

var page_size=200;

$('#search').keypress(function(e) {
    if (e.which==13) {
        var query = $('#search').val();
        $('#search').val('');
        $('#tracks').empty();
        SC.get('/tracks', { limit: page_size, q: query }, function(tracks) {
            $.each(tracks, function(key, track) {
                var element='<div>'+'<a>'+track.title+'</a>'+'</div>';
                $('#tracks').append(element);  
                $("#tracks a").last().attr("href",track.permalink_url);
                $("#tracks a").last().bind('click', false);
            });
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
