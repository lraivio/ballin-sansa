var ROUND_LENGTH = 45;

var drawerQueue = [];
var drawing = [];
var roundTimer;
var word;

module.exports = function (io) {
  function endRound() {
    io.sockets.emit('round end', {word: word});
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
    word = 'pear'; // TODO: Randomize.

    drawerQueue[0].emit('round start', {
      drawer: true,
      word: word,
    });
    drawerQueue[0].broadcast.emit('round start', {
      drawer: false, // TODO: Send the name of the drawer.
    });

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
