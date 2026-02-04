var request = require('request');
var config = require('../config');

var PostSend = function(content, url) {
    // Build the post string from an object

    var arg = {
        url: 'http://' + config.local_server.host + ':' + config.local_server.port + '/' + url,
        json: true,
        body: content,
        method: 'POST'
    };
    /*
    var central_post = request(arg);

    central_post.on('error', function(err) {
        console.log('Post send error:', err);
        console.log(arg);
    });
*/
    var local_post = request(arg);

    local_post.on('error', function(err) {
        console.log('Post send error:', err);
        console.log(arg);
    });

    console.log('Servers post send:', content);
};

module.exports = PostSend;