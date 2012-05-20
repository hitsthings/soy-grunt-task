/*
 * grunt-soy-grunt-task
 * https://github.com/hitsthings/soy-grunt-task
 *
 * Copyright (c) 2012 Adam Ahmed
 * Licensed under the MIT license.
 */

var fs=require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn;

var defaults = {
    outputPathFormat : path.join(process.cwd(), 'public/{INPUT_DIRECTORY}/{INPUT_FILE_NAME}.js'),
    inputPrefix : '',
    codeStyle : 'stringbuilder',
    locales : [],
    messageFilePathFormat : undefined,
    shouldGenerateJsdoc : false,
    shouldProvideRequireSoyNamespaces : false,
    compileTimeGlobalsFile : undefined,
    shouldGenerateGoogMsgDefs : false,
    bidiGlobalDir : 1
};

function extend() {
    var target = Array.prototype.shift.call(arguments);
    Array.prototype.forEach.call(arguments, function(extender) {
        for(var key in extender) {
            if (extender.hasOwnProperty(key)) {
                target[key] = extender[key];
            }
        }
    });
    return target;
}

function compile(inputFiles, options, callback) {
    options = extend({}, defaults, options);

    var cmdOptions = [
            '-jar', path.join(__dirname, '../closure-templates-for-javascript-latest/SoyToJsSrcCompiler.jar'),
            '--outputPathFormat', options.outputPathFormat
        ];

    if (options.inputPrefix) {
        cmdOptions.push('--inputPrefix');
        cmdOptions.push(options.inputPrefix);
        
        // the compiler wants to be given the file paths relative tothe input prefix.
        // we expeect them passed in relative to whatever the grunt default is.
        var resolvedPrefix = path.resolve(options.inputPrefix);
        inputFiles = inputFiles.map(function(file) {
            return path.relative(resolvedPrefix, path.resolve(file));
        });
    }

    if (options.shouldGenerateJsdoc) {
        cmdOptions.push('--shouldGenerateJsdoc');
    }

    if (options.shouldProvideRequireSoyNamespaces) {
        cmdOptions.push('--shouldProvideRequireSoyNamespaces');
    }

    if (options.locales && options.locales.length) {
        cmdOptions.push('--locales');
        cmdOptions.push(options.locales.join ? options.locales.join(',') : options.locales);
    }

    if (options.messageFilePathFormat) {
        cmdOptions.push('--messageFilePathFormat');
        cmdOptions.push(options.messageFilePathFormat);
    }

    if (options.shouldGenerateGoogMsgDefs) {
        cmdOptions.push('--shouldGenerateGoogMsgDefs');
    }

    if (options.bidiGlobalDir) {
        cmdOptions.push('--bidiGlobalDir');
        cmdOptions.push(options.bidiGlobalDir);
    }

    if (options.compileTimeGlobalsFile) {
        cmdOptions.push('--compileTimeGlobalsFile');
        cmdOptions.push(options.compileTimeGlobalsFile);
    }

    if (options.codeStyle) {
        cmdOptions.push('--codeStyle');
        cmdOptions.push(options.codeStyle);
    }

    console.time('soy-compile');
    var java = spawn('java', cmdOptions.concat(inputFiles));

    java.stdout.pipe(process.stdout);
    java.stderr.pipe(process.stderr);

    java.on('exit', function() {
        console.timeEnd('soy-compile');

        if (callback) {
            callback.apply(this, arguments);
        } else {
            var args = Array.prototype.slice.call(arguments);
            console.log.apply(console, args);
        }
    });
}

function extractMsgs(inputFiles, options, callback) {

    options = options || {};

    var cmdOptions = [
            '-jar', path.join(__dirname, '../closure-templates-msg-extractor-latest/SoyMsgExtractor.jar')
        ];

    if (options.outputFile) {
        cmdOptions.push('--outputFile');
        cmdOptions.push(options.outputFile);
    } else if (options.outputPathFormat) {
        cmdOptions.push('--outputPathFormat');
        cmdOptions.push(options.outputPathFormat);
    } else {
        callback(new Error('either options.outputFile or options.outputPathFormat must be specified.'));
        return;
    }

    console.time('soy-extract-msg');
    var java = spawn('java', cmdOptions.concat(inputFiles));

    java.stdout.pipe(process.stdout);
    java.stderr.pipe(process.stderr);

    java.on('exit', function() {
        console.timeEnd('soy-extract-msg');

        if (callback) {
            callback.apply(this, arguments);
        } else {
            var args = Array.prototype.slice.call(arguments);
            console.log.apply(console, args);
        }
    });
}

function getFilesValidation(grunt, files, src) {
    if (files.length) {
        return {
            succeeded : true
        };
    } else if (src && src.length) {
        return {
            succeeded : false,
            error : 'No files were found from the input patterns: '+ src
        };
    } else {
        return {
            succeeded : false,
            warn : 'No input files were provided.  To specify files, add grunt configuration like {\n' +
            '  soy : {\n' +
            '    myTarget : {\n' +
            '      src : [ "**/*.soy" ]\n' +
            '    }' +
            '  }\n' +
            '}'
        };
    }
}

// default input pattern only applies to the soy task, not the helper or direct compile function itself.
var defaultInputPattern = '**/*.soy';

function getFiles(grunt, src) {
    var files = grunt.file.expandFiles(src),
        validation = getFilesValidation(grunt, files, src);

    if (validation.error) {
        grunt.log.error(validation.error);
        return;
    } else if (validation.warn) {
        var defaultFiles = grunt.file.expandFiles([defaultInputPattern]),
            tryDefault = getFilesValidation(grunt, defaultFiles);

        if (!tryDefault.succeeded) {
            grunt.log.error(validation.warn + '\nNo files were found using the default pattern: ' + defaultInputPattern);
            return;
        }

        grunt.log(validation.warn + '\nUsing default pattern: ' + defaultInputPattern);
        files = defaultFiles;
    }

    return files;
}

function addOption(compileOptions, grunt, target, optionName) {
    var option = grunt.config(['soy', target, optionName]);
    if (option !== undefined) {
        compileOptions[optionName] = option;
        grunt.verbose.writeln("Using specified " + optionName + ": " + option);
    } else {
        var displayDefault = typeof defaults[optionName] === 'string' ?
            "'" + defaults[optionName] + "'" :
            defaults[optionName];
        grunt.verbose.writeln("grunt.soy.[target]." + optionName + " not specified. Using default: " + displayDefault);
    }
}

function registerGruntTask(grunt) {
    grunt.registerMultiTask('soy', 'Compile Soy files to JS', function () {

        var compileOptions = {};

        // If their config includes an option, specify it in the options we pass to the compile() function.
        for (var option in defaults) {
            if (defaults.hasOwnProperty(option)) {
                addOption(compileOptions, grunt, this.target, option);
            }
        }

        // turn their file input patterns into a concrete list of file paths.
        var files = getFiles(grunt, this.file.src);

        if (!files) {
            return;
        }

        grunt.verbose.writeln("Compiling files: " + files);
        compile(files, compileOptions, this.async());

    });
}

function registerGruntHelper(grunt) {
    grunt.registerHelper('soy', compile);
}

module.exports = function(grunt) {
    registerGruntTask(grunt);
    registerGruntHelper(grunt);
};

module.exports.compile = compile;
module.exports.extractMsgs = extractMsgs;