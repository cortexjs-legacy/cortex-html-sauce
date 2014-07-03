var util = require('util');
var path = require('path');
var through = require('through2');
var trumpet = require('trumpet');

module.exports = function(stream, file, options) {
  var csses = options.csses || [];
  var base = options.base;
  var tr = trumpet();
  var pipe = through(function(chunk, enc, cb) {
    this.push(chunk);
    cb();
  }, function(cb) {
    this.push(genStyles(csses, base || path.dirname(file)));
    this.push('\n');
    cb();
  });


  var du = tr.createStream('head');

  du.pipe(pipe).pipe(du);

  return stream.pipe(tr);
};


function genStyles(csses, base) {
  return csses.map(function(css) {
    var style = path.relative(base, css);
    if (style.charAt(0) != '.')
      style = './' + style;
    return util.format('<link rel="stylesheet" href="%s">', style);
  }).join('\n');
};