var grunt = require('grunt');

var fs = require('fs');
var path = require('path');

var mkdirp = require('mkdirp');

//via https://gist.github.com/2367067
var rmdir = function(dir) {
  var list = fs.readdirSync(dir);
  for(var i = 0; i < list.length; i++) {
    var filename = path.join(dir, list[i]);
    var stat = fs.statSync(filename);

    if(filename === "." || filename === "..") {
      // pass these files
    } else if(stat.isDirectory()) {
      // rmdir recursively
      rmdir(filename);
    } else {
      // rm fiilename
      fs.unlinkSync(filename);
    }
  }
  fs.rmdirSync(dir);
};


/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/


var inputPaths = [ path.join(__dirname, 'test.soy') ];
var outputDir = path.join(process.cwd(), 'out/test');
var outputFormat = path.join(outputDir, '{INPUT_FILE_NAME}.js');
var expectedOut = outputFormat.replace(/\{(INPUT_FILE_NAME)\}/g, function(match) {
  return 'test.soy';
});

exports['soy'] = {
  setUp: function(done) {
    mkdirp(outputDir, done);
  },
  'helper': function(test) {
    test.expect(2);

    var cancel = setTimeout(function() {
      test.ok(false, 'Compilation timed out.');
      test.done();
      cancel = false;
    }, 2000);

    grunt.helper('soy', inputPaths, { outputPathFormat : outputFormat }, function() {
      if (cancel) {
        clearTimeout(cancel);
        test.ok(path.existsSync(expectedOut), 'Output js file should exist.');
        test.ok(fs.readFileSync(expectedOut, 'utf8').indexOf('Success!') >= 0, 'Output contains compiled template.');
        test.done();
      }
    });
  },
  tearDown : function(done) {
    rmdir(outputDir);
    done();
  }
};
