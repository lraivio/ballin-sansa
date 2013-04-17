module.exports = function (io) {
  var count = 0;
  var drawing = [];
  io.sockets.on('connection', function (socket) {
    count += 1;
    if (drawing) {
      socket.emit('draw', drawing);
    }

    socket.on('disconnect', function () {
      count -= 1;
    });

    if (count == 1) {
      socket.on('draw', function (data) {
        drawing.push.apply(drawing, data);
        socket.broadcast.emit('draw', data);
      });
    }
  });
};
