var amqp = require('amqp');
var http = require('http');
var querystring = require('querystring');

var rabbitMqConnection = amqp.createConnection({ host: 'localhost' });

rabbitMqConnection.on('ready', function(){
  rabbitMqConnection.publish('zombie-for-python', { test: 123 });

  rabbitMqConnection.queue('zombie-for-python', function (queue) {
    // Receive messages
    queue.subscribe(function (message) {
      console.log('received:', message);

      var queryString = querystring.stringify(message);

      if (queryString) {
        http.get({
          host: '192.168.178.9',
          port: 5678,
          path: '/event?' + queryString
        });
      }
    });
  });
});