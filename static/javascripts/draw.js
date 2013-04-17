$(document).ready(function() {
  var socket = io.connect();

  (function(){

    var canvas = document.getElementById('canvas');

    // Make sure <canvas> is completely supported.
    if (canvas.getContext) {
      var ctx = canvas.getContext('2d');
      var paint = false;
      var pointX = [];
      var pointY = [];
      var pointDrag = [];
      var pointColor = [];

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
        paint = false;
        socket.emit('draw', {
          xs: pointX,
          ys: pointY,
          colors: pointColor,
          drags: pointDrag,
        });
      });

      socket.on('draw', function (data) {
        for (var i = 0; i < data.xs.length; i += 1) {
          currentColor = data.colors[i];
          addPointInfo(data.xs[i], data.ys[i], data.drags[i]);
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

      var addPointInfo = function (x, y, dragging) {
        pointX.push(x);
        pointY.push(y);
        pointDrag.push(dragging);
        pointColor.push(currentColor);
      };

      var redraw = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.lineJoin = "round";
        ctx.lineWidth = 4;

        for(var i = 0; i < pointX.length; i++) {
          ctx.beginPath();
          if(pointDrag[i] && i) {
            ctx.moveTo(pointX[i - 1], pointY[i - 1]);
           }else{
             ctx.moveTo(pointX[i] - 1, pointY[i]);
           }
           ctx.lineTo(pointX[i], pointY[i]);
           ctx.closePath();
           ctx.strokeStyle = pointColor[i];
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
