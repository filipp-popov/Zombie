var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var MPlayer = require('node-mplayer')
var Player = require('./components/Player.js');





console.log('app started');

require('./components/init');
require('./components/uart-read');

require('shutdown-handler').on('exit', function() {
  console.log("Shutdown...");
  Player('sound1', 'stop');
  exec('killall mplayer');
});

var routes = require('./routes/index');
var event = require('./routes/event');
var post_event = require('./routes/post_event');

var app = express();
app.disable('etag');//disable cache
var i = 0;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/event', event);
app.use('/post_event', post_event);


function plan() {
  setTimeout(function () {
    console.log(++i);
    Player('sound1');

    setTimeout(function () {
      Player('sound1', 'stop');
      plan();
    },330000);
  }, 5000);
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

process.on('uncaughtException', function (err) {
  console.log(err);
});

//Play('sound1');
//plan();
/*
var player = new MPlayer('/home/pi/rasp_nodejs/Sound_files/hint_do_not_use_force.mp3')
    .on('end', function(){
      console.log('End play');
    })
    .on('error', function(err) {
      console.log('Play error', err);

    });
    player.play();

setTimeout(function () {
  console.log('111');
  player.stop();
}, 2000);
*/

module.exports = app;
