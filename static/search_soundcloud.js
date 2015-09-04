SC.initialize({
  client_id: "process.env['CLIENT_ID']"
});
// find all sounds of buskers licensed under 'creative commons share alike'
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
    var widgetIframe = document.getElementById('player');
    var widget = SC.Widget(widgetIframe);
    widget.load(anchor.getAttribute('href'), {color: "ff0066"}, document.getElementById("player"));
}, true);