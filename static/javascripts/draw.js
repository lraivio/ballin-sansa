$(document).ready(function() {
  var socket = io.connect();

  (function() {

    var canvas = document.getElementById('canvas');

    // Make sure <canvas> is completely supported.
    if (canvas.getContext) {
      var $playerTableBody = $('.players tbody');
      var chatBox = document.getElementById('chat-box');
      var $chatInput = $('.chat-form input');

      var ctx = canvas.getContext('2d');
      var paint = false;
      var points = [];
      var newPoints;
      var drawer = false; // Whether the user is the drawer or not.

      var colors = {
        red:         '#ee4035',
        green:       '#00a94f',
        blue:        '#0079c2',
        yellow:      '#ffd203',
        orange:      '#f89828',
        purple:      '#5a4099',
        brown:       '#453823',
        white:       '#ffffff'
      };
      var currentColor = colors.red;
      var currentSize = 4;

      $('#canvas').on('mousedown', function (event) {
        if (!drawer) {
          return;
        }
        var mouseX = event.pageX - $(this).offset().left;
        var mouseY = event.pageY - $(this).offset().top;
        newPoints = [];
        paint = true;
        addPointInfo(mouseX, mouseY);
        redraw();
      });

      $('#canvas').on('mousemove', function (event) {
        if (paint && drawer) {
          var mouseX = event.pageX - $(this).offset().left;
          var mouseY = event.pageY - $(this).offset().top;
          addPointInfo(mouseX, mouseY, true);
          redraw();
        }
      });

      $('#canvas').on('mouseup mouseleave', function (event) {
        if (paint && drawer) {
          paint = false;
          socket.emit('draw', newPoints);
        }
      });

      $('.chat-form').on('submit', function (event) {
        event.preventDefault();
        // TODO: Make sure that the player drawing can't send messages or at least can't make guesses.
        var message = $chatInput.val();
        $chatInput.val('');
        socket.emit('chat', message);
      });

      socket.on('round end', function (data) {
        drawer = null;
      });

      socket.on('round start', function (data) {
        points = [];
        newPoints = [];
        redraw();
        drawer = data.drawer;
        $('.timer .time').countTo({
          interval: 1000,
          startNumber: data.time - 1,
          endNumber: 0,
          onStart: function (timer) {
            socket.on('round end', function () {
              timer.finished = true;
            });
          }
        });
      });

      socket.on('draw', function (data) {
        var color = currentColor;
        var d;
        for (var i = 0; i < data.length; i += 1) {
          d = data[i];
          addPointInfo(d.x, d.y, d.dragging, d.color, d.size);
        }
        redraw();
      });

      socket.on('update players', function (players) {
        $playerTableBody.empty();
        $.each(players, function (_, player) {
          $playerTableBody.append(
            '<tr><td>' + player.name + '</td><td>' +
            player.points + '</td></tr>'
          );
        });
      });

      socket.on('update chat', function (username, message) {
        var line = username + ': ' + message + '\n';
        chatBox.value += line;
        // Make sure the chat box is scrolled down so the lates messages are shown.
        chatBox.scrollTop = chatBox.scrollHeight;
      });

      $('.size-bar li').on('click', function (event) {
        event.preventDefault();
        var $li = $(event.target).closest('li');
        $('.size-bar li').removeClass('active');
        $li.addClass('active');
        currentSize = $li.find('a').attr('data-size');
      });

      var initColorBar = function () {
        var $colorBar = $('.color-bar');
        $.each(colors, function (key, value) {
          var $li = $('<li></li>')
            .append(
              $('<a href="#"></a>')
                .attr('data-color', key)
                .css('background-color', value)
            );
          $colorBar.append($li);
        });
        $colorBar.children().first().addClass('active');
      };

      var addPointInfo = function (x, y, dragging, color, size) {
        var point = {
          x: x,
          y: y,
          dragging: dragging,
          color: color || currentColor,
          size: size || currentSize
        };
        if (newPoints)
          newPoints.push(point);
        points.push(point);
      };

      var redraw = function () {
        var point;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.lineJoin = "round";

        for (var i = 0; i < points.length; i++) {
          point = points[i];
          ctx.beginPath();
          if (point.dragging && i) {
            ctx.moveTo(points[i - 1].x, points[i - 1].y);
          } else {
            ctx.moveTo(point.x - 1, point.y);
          }
          ctx.lineTo(point.x, point.y);
          ctx.closePath();
          ctx.strokeStyle = point.color;
          ctx.lineWidth = point.size;
          ctx.stroke();
        }
      };

      initColorBar();
      socket.emit(
        'add player',
        prompt('Please enter a username you want to use when playing.')
      );
      socket.on('invalid name', function () {
        socket.emit(
          'add player',
          prompt('That name is already taken. Please enter another name.')
        );
      });

      $('.color-bar li').on('click', function (event) {
        event.preventDefault();
        var $li = $(event.target).closest('li');
        $('.color-bar li').removeClass('active');
        $li.addClass('active');
        currentColor = $li.find('a').attr('data-color');
      });
    }

  })();

});
