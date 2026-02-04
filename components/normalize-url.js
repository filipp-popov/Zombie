var normalize = function (url) {
    var pattern = /^((http|https):\/\/){0,1}((([0-9]{1,3}\.){3}[0-9]{1,3})|([a-z-_0-9]{2,}(\.[a-z]{2,})*))(:([0-9]{1,5})){0,1}\/{0,1}$/;

    var matches = url.match(pattern);

    if (!matches) {
        new TypeError('URL normalize invalid format!');
    }

    var result = {
        protocol: 'http',
        host: 'localhost',
        port: 80
    };

    if (matches[2]) {
        result.protocol = matches[2];
    }

    if (matches[3]) {
        result.host = matches[3];
    }

    if (matches[9]) {
        result.port = matches[9];
    }

    result.url = result.protocol + '://' + result.host + ':' + result.port + '/';

    return result;
};

module.exports = normalize;