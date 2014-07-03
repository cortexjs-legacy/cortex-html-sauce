var path = require('path');
var readjson = require('read-cortex-json');
var through = require('through2');
var concat = require('concat-stream');

module.exports = function(cwd, options, callback) {
  var content = options.content;
  var fstream = options.stream;
  var html = options.html;
  var base = options.base;

  if (!cwd || !html) {
    var err = new Error("'cwd' and 'html' must be provided");
    if (callback) return callback(err);
    throw err;
  }


  if (callback) {
    if (!content)
      return callback(new Error("'content' must be provided when using callback"));
  }


  if (content) { // if content is set, ignore fstream
    fstream = through();
    fstream.write(content);
    fstream.end();
  }

  var ret = through();

  var ocwd = cwd;
  readjson.package_root(cwd, function(cwd) {
    // find cwd
    if (cwd) {
      readjson.enhanced(cwd, function(err, pkg) {
        var built_root = path.join(cwd, 'neurons');
        require('./lib/digdep')(pkg, built_root, function(err, deps, tree) {
          if (err) return onError(err);
          require('./lib/css')(deps, built_root, function(err, csses) {
            if (err) return onError(err);

            var tr = require('./lib/gen')(fstream, html, {
              csses: csses,
              base: base
            });
            if (callback) {
              tr.pipe(concat(function(data) {
                callback(null, data.toString());
              }));

            } else {
              tr.pipe(ret);
            }
          });
        });
      });
    } else {
      onError(new Error("Can not find cwd from: " + ocwd));
    }
  });


  return ret;

  function onError(err) {
    if (callback) return callback(err);
    else ret.emit('error', err);
  }
};