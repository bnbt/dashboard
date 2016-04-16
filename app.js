var app = require('express')();
var server = require('http').Server(app);
var swig = require('swig');
var path = require('path');

// view engine setup
app.set('views', __dirname);
app.engine('html', swig.renderFile);
app.set('view engine', 'html');

// server and routing
server.listen(8001);
app.get('/', function (req, res) {
  res.render('index');
});

app.get('/settings', function (req, res) {
  res.render('settings');
});

var io = require('socket.io')(server);
// socket.io demo
io.on('connection', function (socket) {
  socket.emit('server event', { foo: 'bar' });
  socket.on('client event', function (data) {
    console.log(data);
  });
});