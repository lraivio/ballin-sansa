var ROUND_LENGTH = 60;

var drawerQueue = [];
var players = Object.create(null);
var drawing = [];
var roundTimer;
var roundStartTime;
var word;
var words = require('./words');

module.exports = function (io) {
  function calculatePoints(timeRemaining, drawer) {
    return ~~(timeRemaining / 100);
  }

  function endRound(guesser) {
    var timeRemaining =
      ROUND_LENGTH * 1000 -
      (new Date().getTime() - roundStartTime);
    io.sockets.emit('round end', {word: word});
    io.sockets.emit(
      'update chat',
      'Server',
      (guesser
       ? guesser + " guessed the word!"
       : "Round ended!")
      + " The word was '" + word + "'."
    );

    if (guesser) {
      players[guesser] += calculatePoints(timeRemaining, false);
      players[drawerQueue[0].username] += calculatePoints(timeRemaining, true);
      io.sockets.emit('update players', players);
    }

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
    word = words[~~(Math.random() * words.length)];

    drawerQueue[0].emit('round start', {
      drawer: true,
      word: word,
      time: ROUND_LENGTH
    });
    drawerQueue[0].emit(
      'update chat',
      'Server',
      "Round started! It's your turn to draw. The word is '" + word + "'."
    );
    drawerQueue[0].broadcast.emit('round start', {
      drawer: false,
      time: ROUND_LENGTH
    });
    drawerQueue[0].broadcast.emit(
      'update chat',
      'Server',
      "Round started! It's " + drawerQueue[0].username + "'s turn to draw."
    );

    roundTimer = setTimeout(endRound, ROUND_LENGTH * 1000);
    roundStartTime = new Date().getTime();
  }

  io.sockets.on('connection', function (socket) {
    if (roundTimer) {
      // Send info required for current round.
      socket.emit('draw', drawing);
      socket.emit('round start', {
        drawer: false,
        time: ROUND_LENGTH
      });
    }

    socket.on('disconnect', function () {
      if (socket === drawerQueue[0])
        endRound();
      // Remove from the queue.
      drawerQueue.splice(drawerQueue.indexOf(socket), 1);
      delete players[socket.username];
      io.sockets.emit('update players', players);
      socket.broadcast.emit(
        'update chat',
        'Server',
        socket.username + ' has left the game'
      );
    });

    socket.on('add player', function (username) {
      var lowerCaseName = username.toLowerCase();
      for (var name in players) {
        if (name.toLowerCase() === lowerCaseName) {
          socket.emit('invalid name');
          return;
        }
      }
      if (lowerCaseName === 'server' || lowerCaseName.length === 0) {
        socket.emit('invalid name');
        return;
      }

      socket.username = username;
      players[username] = 0;
      io.sockets.emit('update players', players);
      socket.emit('update chat', 'Server', 'You have joined the game');
      socket.broadcast.emit(
        'update chat',
        'Server',
        username + ' has joined the game'
      );

      drawerQueue.push(socket);
      // Start round if needed.
      if (drawerQueue.length == 2 && !roundTimer) {
        startRound();
      }
    });

    socket.on('draw', function (data) {
      if (socket === drawerQueue[0]) {
        drawing.push.apply(drawing, data);
        socket.broadcast.emit('draw', data);
      }
    });

    socket.on('chat', function (message) {
      if (socket === drawerQueue[0])
        return;

      io.sockets.emit('update chat', socket.username, message);
      if (message.toLowerCase() === word) {
        endRound(socket.username);
      }
    });
  });
};
