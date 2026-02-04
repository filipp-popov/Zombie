var amqp = require('amqp');

var connection = amqp.createConnection({host: 'localhost'});

console.log('Starting...');

connection.on('ready', function () {
    console.log('Sending...');
    connection.publish('zombie-for-python', { test: 123 });
    console.log('Send success!');
});