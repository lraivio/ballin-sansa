var ROUND_LENGTH = 45;

var drawerQueue = [];
var usernames = {};
var drawing = [];
var roundTimer;
var word;
var words = require('./words');

module.exports = function (io) {
  function endRound() {
    var chatMessage = '';
    io.sockets.emit('round end', {word: word});
    chatMessage = 'Round ended! The word was "' + word + '".';
    io.sockets.emit('update chat', 'Server', chatMessage);

    clearTimeout(roundTimer);
    drawing = [];
    word = undefined;
    roundTimer = undefined;

    // Move the drawer to be last in queue.
    drawerQueue.push(drawerQueue.shift());

    if (drawerQueue.length > 1) {
      startRound();
    }
  }

  function startRound() {
    var chatMessage = '';
    word = words[~~(Math.random() * words.length)];

    drawerQueue[0].emit('round start', {
      drawer: true,
      word: word
    });
    chatMessage = 'Round started! It\'s your turn to draw. The word is "' + word + '".';
    drawerQueue[0].emit('update chat', 'Server', chatMessage);
    drawerQueue[0].broadcast.emit('round start', {
      drawer: false // TODO: Send the name of the drawer.
    });
    chatMessage = 'Round started! It\'s ' + drawerQueue[0].username + '\'s turn to draw.';
    drawerQueue[0].broadcast.emit('update chat', 'Server', chatMessage);

    roundTimer = setTimeout(endRound, ROUND_LENGTH * 1000);
  }

  io.sockets.on('connection', function (socket) {
    drawerQueue.push(socket);

    if (drawing) {
      // Send the existing drawing.
      socket.emit('draw', drawing);
    }

    socket.on('disconnect', function () {
      if (socket === drawerQueue[0])
        endRound();
      // Remove from the queue.
      drawerQueue.splice(drawerQueue.indexOf(socket), 1);
      delete usernames[socket.username];
      io.sockets.emit('update users', usernames);
      socket.broadcast.emit('update chat', 'Server', socket.username + ' has left the game');
    });

    socket.on('add player', function (username) {
      socket.username = username;
      // TODO: Check that username is unique.
      usernames[username] = username;
      io.sockets.emit('update players', usernames);
      socket.emit('update chat', 'Server', 'You have joined the game');
      socket.broadcast.emit('update chat', 'Server', username + ' has joined the game');
    });

    socket.on('draw', function (data) {
      if (socket === drawerQueue[0]) {
        drawing.push.apply(drawing, data);
        socket.broadcast.emit('draw', data);
      }
    });

    // Start round if needed.
    if (drawerQueue.length == 2 && !roundTimer) {
      startRound();
    }
  });
};
