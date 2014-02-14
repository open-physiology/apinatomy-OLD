module.exports = function (grunt) {

	// loading grunt plugins

	grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-sync-pkg');
	grunt.loadNpmTasks('grunt-madge');

	// constants

	var PROJECT_JS_FILES = ['client/**/*.js', '!client/lib/**/*.js'];

	// main configuration block

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

	    // transpiling from .scss to .css

	    compass: {
		    specify: ['client/index.scss']
	    },

	    // minification

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.js': PROJECT_JS_FILES
                }
            }
        },

	    // running tests

        jasmine: {
            src: 'client/js/*.js',
            options: {
                specs: 'spec/js/*-spec.js',
	            helpers: [
		            'node_modules/jasmine-expect/dist/jasmine-matchers.js',
	            	'spec/js/matchers.js'
	            ],
                outfile: 'SpecRunner.html',
	            keepRunner: true,
                template: require('grunt-template-jasmine-requirejs'),
                templateOptions: {
                    requireConfig: {
                        baseUrl: 'client/js/'
                    }
                }
            }
        },

	    // synchronizing the bower.json and package.json files

	    sync: {
            include: ['name', 'version', 'main', 'description', 'author', 'license']
        },

	    // checking for circular dependencies between RequireJS modules

	    madge: {
		    options: { format: 'amd' },
		    all: PROJECT_JS_FILES
	    },

	    // various automatic actions during development

        watch: {
	        js: {
		        files: PROJECT_JS_FILES,
		        tasks: ['madge']
	        },
	        scss: {
		        files: ['client/**/*.scss'],
		        tasks: ['compass']
	        },
            config: {
                files: ['package.json'],
                tasks: ['sync']
            }
        }
    });

    grunt.registerTask('default', ['madge', 'jasmine', 'uglify']);

};

