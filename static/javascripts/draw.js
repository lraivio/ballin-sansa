$(document).ready(function() {
  var socket = io.connect();

  (function() {

    var canvas = document.getElementById('canvas');

    // Make sure <canvas> is completely supported.
    if (canvas.getContext) {
      var ctx = canvas.getContext('2d');
      var paint = false;
      var points = [];
      var newPoints;

      var colors = {
        red:         '#ee4035',
        green:       '#00a94f',
        blue:        '#0079c2',
        yellow:      '#ffd203',
        orange:      '#f89828',
        purple:      '#5a4099'
      };
      var currentColor = colors.red;

      $('#canvas').on('mousedown', function (event) {
        var mouseX = event.pageX - $(this).offset().left;
        var mouseY = event.pageY - $(this).offset().top;
        newPoints = [];
        paint = true;
        addPointInfo(mouseX, mouseY);
        redraw();
      });

      $('#canvas').on('mousemove', function (event) {
        if (paint) {
          var mouseX = event.pageX - $(this).offset().left;
          var mouseY = event.pageY - $(this).offset().top;
          addPointInfo(mouseX, mouseY, true);
          redraw();
        }
      });

      $('#canvas').on('mouseup mouseleave', function (event) {
        if (paint) {
          paint = false;
          socket.emit('draw', newPoints);
        }
      });

      socket.on('round end', function (data) {
        console.log('round ended!', data);
        points = [];
        newPoints = [];
        redraw();
      });
      socket.on('round start', function (data) {
        console.log('round started!', data);
        if (data.drawer)
          console.log('You are drawing!');
      });

      socket.on('draw', function (data) {
        var color = currentColor;
        var d;
        for (var i = 0; i < data.length; i += 1) {
          d = data[i];
          addPointInfo(d.x, d.y, d.dragging, d.color);
        }
        redraw();
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

      var addPointInfo = function (x, y, dragging, color) {
        var point = {
          x: x,
          y: y,
          dragging: dragging,
          color: color || currentColor,
        };
        if (newPoints)
          newPoints.push(point);
        points.push(point);
      };

      var redraw = function () {
        var point;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.lineJoin = "round";
        ctx.lineWidth = 4;

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
          ctx.stroke();
        }
      };

      initColorBar();

      $('.color-bar li').on('click', function (event) {
        event.preventDefault();
        var $li = $(event.target).closest('li');
        $('.color-bar li').removeClass('active');
        $li.addClass('active');
        currentColor = $li.children().first().attr('data-color');
      });
    }

  })();

});
