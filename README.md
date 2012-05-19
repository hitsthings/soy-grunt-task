# soy-grunt-task

Grunt task to compile Soy / Closure Templates

## Getting Started
Install this grunt plugin next to your project's [grunt.js gruntfile][getting_started] with: `npm install grunt-soy`

Then add this line to your project's `grunt.js` gruntfile:

```javascript
grunt.loadNpmTasks('grunt-soy');
```

Configure the soy task in your initConfig call (everything is optional, these are the defaults):

```javascript
grunt.initConfig({
    ...
    soy : {
    	src: [ '**/*.soy' ],
    	inputPrefix : '',
    	outputPathFormat : 'public/{INPUT_DIRECTORY}/{INPUT_FILE_NAME}.js',
	}
	...
});
```

* src : an array of glob patterns for finding input files.  matches standard GruntMultiTask syntax.
* inputPrefix : your src patterns will be resolved against this. It will also be passed to the compiler such that the {INPUT_DIRECTORY} format variable is relative to inputPrefix
* outputPathFormat : A format string for generating output files. Available variables can be found in the [Closure Template docs][https://developers.google.com/closure/templates/docs/javascript_usage#compilation]


[grunt]: https://github.com/cowboy/grunt
[getting_started]: https://github.com/cowboy/grunt/blob/master/docs/getting_started.md


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt][grunt].

## Release History
0.1.0 - basic support - src, inputPrefix, and outputPathPrefix

## Roadmap
- support all the compiler flags.


## License
Copyright (c) 2012 Adam Ahmed  
Licensed under the MIT license.
