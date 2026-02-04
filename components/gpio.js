var gpio = require('rpi-gpio');
var http = require('http');
var querystring = require('querystring');

//gpio.setPollFrequency(500);
//gpio.setup(8, gpio.DIR_IN);
//gpio.on('change', function(channel, value) {
//    console.log('Channel ' + channel + ' value is now ' + value);
//});

var pin = 5;
var masterValue;

gpio.setup(pin, gpio.DIR_IN, function () {
    reader();
});

var reader = function () {
    gpio.read(pin, function(err, value) {
        if (masterValue !== value) {
            masterValue = value;
            console.log('The value is ' + !value);
            sendChangesToServer(!value);
        }
    });

    setTimeout(reader, 100);
};

var sendChangesToServer = function (value) {
    //area=zombie&id=key_air_tube_lock_on&param=true
      var queryString = querystring.stringify({
          area: 'zombie',
          id: 'key_air_tube_lock_on',
          param: value
      });

      if (queryString) {
        http.get({
          host: '192.168.178.9',
          port: 5678,
          path: '/event?' + queryString
        });
      }
};