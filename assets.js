var less = require('less');

module.exports = {
  'js': {
    'route': /\/static\/site\.js/,
    'path': './static/javascripts/',
    'dataType': 'javascript',
    'files': [
      'vendor/jquery-1.9.1.js',
      'vendor/jquery.countTo.js',
      '*',
    ],
  },
  'css': {
    'route': /\/static\/site\.css/,
    'path': './static/stylesheets/',
    'dataType': 'css',
    'files': [
      '*',
    ],
    'preManipulate': {
      '^': [
        function (content, path, index, last, callback) {
          // Compile .less files.
          if (path.slice(-5) == '.less')
            less.render(content, function (err, content) {
              if (err) throw err;
              callback(content);
            });
          else
            callback(content);
        },
      ],
    },
  },
};
