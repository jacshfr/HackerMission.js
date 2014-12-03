// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// usernames which are currently connected to the chat
var usernames = [];
var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames.push(username);
    addedUser = true;
    socket.emit('login', {
      numUsers: usernames.length
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: usernames.length
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user clicks Start Game
  socket.on('startGame', function() {
    var userIndex = usernames.indexOf(socket.username);
    if (userIndex % 2 == 0) {
      socket.emit('new role', 'You are a Spy');
    } else {
      socket.emit('new role', 'You are Loyal to the Cause');
    }
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      usernames.splice(usernames.indexOf(socket.username), 1);

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: usernames.length
      });
    }
  });
});
