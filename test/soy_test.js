var grunt = require('grunt');

var fs = require('fs');
var path = require('path');



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
    fs.mkdir(outputDir, done);
  },
  'helper': function(test) {
    test.expect(1);

    var cancel = setTimeout(function() {
      test.ok(false, 'Compilation timed out.');
      test.done();
      cancel = false;
    }, 2000);

    grunt.helper('soy', null, inputPaths, outputFormat, function() {
      if (cancel) {
        clearTimeout(cancel);
        test.ok(path.existsSync(expectedOut), 'Output js file should exist.');
        test.done();
      }
    });
  },
  tearDown : function(done) {
    fs.rmdir(outputDir, done);
  }
};
