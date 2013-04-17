module.exports = function (io) {
    var count = 0;
    io.sockets.on('connection', function (socket) {
        count += 1;

        socket.on('disconnect', function () {
            count -= 1;
        });

        if (count == 1) {
            socket.on('draw', function (data) {
                socket.broadcast.emit('draw', data);
            });
        }
    });
};
