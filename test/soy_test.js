var grunt = require('grunt');

var fs = require('fs');
var path = require('path');

var mkdirp = require('mkdirp');

var soy = require('../tasks/soy');

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

function testHelper(test, options, numAssertions, customAssertions) {
    test.expect(2 + (numAssertions || 0));

    var cancel = setTimeout(function() {
      test.ok(false, 'Compilation timed out.');
      test.done();
      cancel = false;
    }, 2000);

    grunt.helper('soy', inputPaths, options, function() {
      if (cancel) {
        clearTimeout(cancel);
        test.ok(path.existsSync(expectedOut), 'Output js file should exist.');
        var content = fs.readFileSync(expectedOut, 'utf8');
        test.ok(/Success!/.test(content), 'Output contains compiled template.');

        if (customAssertions) {
          customAssertions(content);
        }

        test.done();
      }
    });
}

exports['soy'] = {
  setUp: function(done) {
    mkdirp(outputDir, done);
  },
  'helper-basic': function(test) {
    testHelper(test, {
      outputPathFormat : outputFormat
    });
  },
  'helper-inputprefix': function(test) { //DIRTY: this test assumes test file is in test/
    testHelper(test, {
      outputPathFormat : path.join(outputDir, '{INPUT_DIRECTORY}/{INPUT_FILE_NAME}.js'),
      inputPrefix : 'test/'
    });
  },
  'helper-codestyle': function(test) {
    testHelper(test, {
      outputPathFormat : outputFormat,
      codeStyle : 'concat'
    }, 1, function(content) {
      test.ok(!/StringBuilder/.test(content), "Output doesn't contain soy.StringBuilder.");
    });
  },
  'helper-jsdoc': function(test) {
    testHelper(test, {
      outputPathFormat : outputFormat,
      shouldGenerateJsdoc : true
    }, 1, function(content) {
      test.ok(/@return \{string\}/.test(content), "Output contains JSDoc type annotations.");
    });
  },
  'helper-providerequirenamespaces': function(test) {
    testHelper(test, {
      outputPathFormat : outputFormat,
      shouldProvideRequireSoyNamespaces : true
    }, 1, function(content) {
      test.ok(/goog.provide/.test(content), "Output contains goog.provide call.");
    });
  },
  'helper-generatemsgdefs': function(test) {
    testHelper(test, {
      outputPathFormat : outputFormat,
      shouldGenerateGoogMsgDefs : true
    }, 1, function(content) {
      test.ok(/goog.getMsg/.test(content), "Output contains goog.getMsg call.");
    });
  },
  'helper-compiletimeglobals': function(test) {
    testHelper(test, {
      outputPathFormat : outputFormat,
      compileTimeGlobalsFile : 'test/globals.txt'
    }, 1, function(content) {
      test.ok(/globalremoved/.test(content), "Global variable was evaluated at compile-time.");
    });
  },
  'helper-localized': function(test) {
    //soy.extractMsgs(inputPaths, { outputFile : 'test/test.xlf' }, function() {
      testHelper(test, {
        outputPathFormat : outputFormat,
        locales : ['en-US', 'en-AU'],
        messageFilePathFormat : 'test/test.xlf'
      }, 1, function(content) {
        test.ok(/localized success!/.test(content), "Output contains localized msgs.");
      });
    //});
  },
  tearDown : function(done) {
    rmdir(outputDir);
    done();
  }
};
