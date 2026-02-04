/**
 * Created by ����� on 13.09.2015.
 */
var http = require("http");
var config = require('./../config.json');

var send2server = function(queryString) {
    if (queryString) {
        //var central_address = {
        //    host: config.central_server.host,
        //    port: config.central_server.port,
        //    path: '/event?' + queryString
        //};

        var local_address = {
            host: config.local_server.host,
            port: config.local_server.port,
            path: '/event?' + queryString
        };



        console.log('Servers GET send:', queryString);
/*
        var central_request = http.get(central_address);
        central_request.on('error', function(err) {
            console.log('Send to central server error:', err);
            console.log('Address:', central_address);
        });
*/

         var local_request = http.get(local_address);
         local_request.on('error', function(err) {
             console.log('Send to local server error:', err);
             console.log(local_address);
         });

    }
};

module.exports = send2server;

