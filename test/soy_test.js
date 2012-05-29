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


var testDotSoy = [ path.join(__dirname, 'test.soy') ];
var outputDir = path.join(process.cwd(), 'out/test');
var outputFormat = path.join(outputDir, '{INPUT_FILE_NAME}.js');
var testDotSoyExpectedOut = outputFormat.replace(/\{(INPUT_FILE_NAME)\}/g, function(match) {
  return 'test.soy';
});

function testHelper(test, opt_paths, options, numAssertions, customAssertions) {
    var inputPaths, expectedOut;

    if (arguments.length < 5) {
      customAssertions = numAssertions;
      numAssertions = options;
      options = opt_paths;
      opt_paths = undefined;
    }

    if (opt_paths) {
      inputPaths = [ opt_paths.src ];
      expectedOut = opt_paths.dest;
    } else {
      inputPaths = testDotSoy;
      expectedOut = testDotSoyExpectedOut;
    }

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
  'helper-skip-declaring-tld': function(test) {
    testHelper(test, {
      outputPathFormat : outputFormat,
      shouldDeclareTopLevelNamespaces : false
    }, 1, function(content) {
      test.ok(!/var test/.test(content), "test namespace wasn't declared.");
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
      shouldGenerateGoogMsgDefs : true,
      googMsgsAreExternal : true,
      bidiGlobalDir : 1
    }, 2, function(content) {
      test.ok(/goog.getMsg/.test(content), "Output contains goog.getMsg call.");
      test.ok(/MSG_EXTERNAL/.test(content), "Output uses MSG_EXTERNAL naming.");
    });
  },
  'helper-generatemsgdefs+googIsRtl': function(test) {
    testHelper(test, {
      outputPathFormat : outputFormat,
      shouldGenerateGoogMsgDefs : true,
      useGoogIsRtlForBidiGlobalDir : true,
      shouldProvideRequireSoyNamespaces : true
    }, 2, function(content) {
      test.ok(/goog.getMsg/.test(content), "Output contains goog.getMsg call.");
      test.ok(/goog.i18n.bidi.IS_RTL/.test(content), "goog.i18n.bidi.IS_RTL was used.");
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
    //soy.extractMsgs(testDotSoy, { outputFile : 'test/test.xlf' }, function() {
      testHelper(test, {
        outputPathFormat : outputFormat,
        locales : ['en-US', 'en-AU'],
        messageFilePathFormat : 'test/test.xlf'
      }, 1, function(content) {
        test.ok(/localized success!/.test(content), "Output contains localized msgs.");
      });
    //});
  },
  'helper-css': function(test) {
    testHelper(test, {
      outputPathFormat : outputFormat,
      cssHandlingScheme : 'reference'
    }, 1, function(content) {
      test.ok(/opt_data.aThing/.test(content), "CSS command evaluated as data reference.");
    });
  },
  'helper-ijdata': function(test) {
    testHelper(test, {
      outputPathFormat : outputFormat,
      isUsingIjData : true
    }, 1, function(content) {
      test.ok(/opt_ijData/.test(content), "opt_ijData was rendered even though no $ij data was referenced.");
    });
  },
  'helper-plugins': function(test) {

    soy.extractMsgs([path.join(__dirname, 'test-plugins.soy')], { outputFile : 'test/test-plugins.xlf' }, function() {
    testHelper(test, {
      src : path.join(__dirname, 'test-plugins.soy'),
      dest : outputFormat.replace(/\{(INPUT_FILE_NAME)\}/g, function(match) {
            return 'test-plugins.soy';
          })
    }, {
      outputPathFormat : outputFormat,
      classpath : path.join(__dirname, 'testing.jar'),
      messagePluginModule : 'test.MsgPluginModule',
      pluginModules : ['test.FunctionPluginModule', 'test.DirectivePluginModule'],
      locales: ['en'],
      messageFilePathFormat : 'test/test.xlf'
    }, 3, function(content) {
      test.ok(/Message Plugin called/.test(content), "Custom msg plugin replaced our text.");
      test.ok(/SoyFunction called/.test(content), "Custom function replaced our text.");
      test.ok(/Directive called/.test(content), "Custom print directive replaced our text.");
    });
    });
  },
  tearDown : function(done) {
    rmdir(outputDir);
    done();
  }
};
