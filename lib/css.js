var async = require('async');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');

module.exports = function(digdeps, built_root, callback) {

  if (!built_root)
    return callback(new Error("'built_root' must be provided"));

  var cssdeps = digdeps.filter(function(pkg) {
    return pkg.css && pkg.css.length;
  });

  if (!cssdeps.length) // no css output
    return callback(null, {});

  // mediation
  var ficss;
  try {
    ficss = require('mediation')(cssdeps);
  } catch (e) {
    // conflict
    return callback(e);
  }

  cssdeps = cssdeps.filter(function(dep) {
    var name = dep.name,
      version = dep.version;

    return ficss[name] && ficss[name][version];
  });


  async.map(cssdeps || [], function(pkg, cb) {
    var name = pkg.name;
    var version = pkg.version;

    // check existence
    async.map(pkg.css.map(function(c) {
      return path.resolve(built_root, ['./', name, '/', version, '/', c].join(''));
    }), function(c, cb) {
      fs.exists(c, function(exists) {
        if (!exists)
          return cb(new Error("Can not find css file '" + c + "' for: " + name + "@" + version));
        cb(null, c);
      });
    }, function(err, rs) {
      cb(err, rs);
    });
  }, function(err, csses) {
    csses = _.flatten(csses);
    callback(null, csses);

  });
};