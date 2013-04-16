$(document).ready(function() {

  (function(){

    var canvas = document.getElementById('canvas');

    // Make sure <canvas> is completely supported.
    if (canvas.getContext) {
      var ctx = canvas.getContext('2d');
      var paint = false;
      var xCoordinates = [];
      var yCoordinates = [];
      var drag = [];

      $('#canvas').on('mousedown', function (event) {
        var mouseX = event.pageX - $(this).offset().left;
        var mouseY = event.pageY - $(this).offset().top;
        paint = true;
        addCoordinates(mouseX, mouseY);
        redraw();
      });

      $('#canvas').on('mousemove', function (event) {
        if (paint) {
          var mouseX = event.pageX - $(this).offset().left;
          var mouseY = event.pageY - $(this).offset().top;
          addCoordinates(mouseX, mouseY, true);
          redraw();
        }
      });

      $('#canvas').on('mouseup mouseleave', function (event) {
        paint = false;
      });

      var addCoordinates = function (x, y, dragging) {
        xCoordinates.push(x);
        yCoordinates.push(y);
        drag.push(dragging);
      };

      var redraw = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "#df4b26";
        ctx.lineJoin = "round";
        ctx.lineWidth = 4;

        for(var i = 0; i < xCoordinates.length; i++) {
          ctx.beginPath();
          if(drag[i] && i) {
            ctx.moveTo(xCoordinates[i - 1], yCoordinates[i - 1]);
           }else{
             ctx.moveTo(xCoordinates[i] - 1, yCoordinates[i]);
           }
           ctx.lineTo(xCoordinates[i], yCoordinates[i]);
           ctx.closePath();
           ctx.stroke();
        }
      };
    }

  })();

});
