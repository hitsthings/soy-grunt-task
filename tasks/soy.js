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

var defaultOutputPathFormat = path.join(process.cwd(), 'public_html/soy/{INPUT_DIRECTORY}/{INPUT_FILE_NAME}.js');

function compile(inputPrefix, inputFiles, outputPathFormat, callback) {
    console.time('compile-soy');

    var options = [
            '-jar', path.join(__dirname, '../closure-templates-for-javascript-latest/SoyToJsSrcCompiler.jar'),
            '--outputPathFormat', outputPathFormat || defaultOutputPathFormat
        ];

    if (inputPrefix) {
        options.push('--inputPrefix');
        options.push(inputPrefix);
    }

    var java = spawn('java', options.concat(inputFiles));

    java.stdout.pipe(process.stdout);
    java.stderr.pipe(process.stderr);

    java.on('exit', callback || function() {
        var args = Array.prototype.slice.call(arguments);
        console.timeEnd('compile-soy');
        console.log.apply(console, args);
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
            '    myTarget : [ "**/*.soy" ]\n' +
            '  }\n' +
            '}'
        };
    }
}

function registerGruntTask(grunt) {
    grunt.registerMultiTask('soy', 'Compile Soy files to JS', function () {

        var outputPathFormat = grunt.config(['soy', this.target, 'outputPathFormat']);
        if (outputPathFormat) {
            grunt.verbose.writeln("Using specified outputPathFormat: " + outputPathFormat);
        } else {
            outputPathFormat = defaultOutputPathFormat;
            grunt.verbose.writeln("grunt.soy.[target].outputPathFormat not specified. Using default: " + defaultOutputPathFormat);
        }

        var inputPrefix = grunt.config(['soy', this.target, 'inputPrefix']);
        if (inputPrefix) {
            grunt.verbose.writeln("Using specified inputPrefix: " + inputPrefix);
        } else {
            grunt.verbose.writeln("grunt.soy.[target].inputPrefix not specified.");
        }

        var files = grunt.file.expandFiles(this.file.src),
            validation = getFilesValidation(grunt, files, this.file.src);

        if (validation.error) {
            grunt.log.error(validation.error);
            return;
        } else if (validation.warn) {
            var defaultPattern = '**/*.soy',
                defaultFiles = grunt.file.expandFiles([defaultPattern]),
                tryDefault = getFilesValidation(grunt, defaultFiles);

            if (!tryDefault.succeeded) {
                grunt.log.error(validation.warn + '\nNo files were found using the default pattern: ' + defaultPattern);
                return;
            }

            grunt.log(validation.warn + '\nUsing default pattern: ' + defaultPattern);
            files = defaultFiles;
        }

        if (inputPrefix) {
            var resolvedPrefix = path.resolve(inputPrefix);
            files = files.map(function(file) {
                return path.relative(resolvedPrefix, path.resolve(file));
            });
        }

        grunt.verbose.writeln("Compiling files: " + files);
        compile(inputPrefix, files, outputPathFormat, this.async());

    });
}

function registerGruntHelper(grunt) {
    grunt.registerHelper('soy', compile);
}

module.exports = function(grunt) {
    registerGruntTask(grunt);
    registerGruntHelper(grunt);
};

exports.compile = compile;