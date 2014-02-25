module.exports = function (grunt) {

	//// loading grunt plugins

	[ 'grunt-contrib-compass',
	  'grunt-contrib-uglify',
	  'grunt-contrib-jasmine',
	  'grunt-contrib-watch',
	  'grunt-sync-pkg',
	  'grunt-madge'
	].map(grunt.loadNpmTasks);


	//// constants

	var BANNER = '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n';

	var PROJECT_JS_FILES = ['client/**/*.js', '!client/lib/**/*.*'];
	var PROJECT_SPEC_JS_FILES = ['spec/**/*-spec.js', 'node_modules/jasmine-expect/dist/jasmine-matchers.js'];
	var PROJECT_SPEC_HELPER_JS_FILES = ['spec/**/*-helper.js'];
	var PROJECT_SCSS_FILES = ['client/**/*.scss', '!client/lib/**/*.*'];


	//// main configuration block

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		//// transpiling from .scss to .css

		compass: {
			options: {
				specify:    ['client/index.scss'],
				banner:     BANNER,
				app:        'stand_alone',
				cssDir:     'client',
				sassDir:    'client',
				imagesDir:  'lib/compass-twitter-bootstrap/vendor/assets/images',
				httpPath:   '/',
				importPath: [
					'client/lib/bootstrap-sass-official/vendor/assets/stylesheets',
					'client/lib/bootstrap-sass-official/vendor/assets/fonts'
				]
			},
			dev:     {
				options: {
					environment: 'development',
					outputStyle: 'nested'
				}
			},
			dist:    {
				options: {
					environment: 'production',
					outputStyle: 'compressed'
				}
			}
		},

		//// minification

		uglify: {
			dist: {
				options: {
					banner: BANNER
				},
				files:   {
					'dist/<%= pkg.name %>.min.js': PROJECT_JS_FILES
				}
			}
		},

		//// running tests

		jasmine: {
			all: {
				options: {
					specs:           PROJECT_SPEC_JS_FILES,
					helpers:         PROJECT_SPEC_HELPER_JS_FILES,
					outfile:         'SpecRunner.html',
					keepRunner:      true,
					template:        require('grunt-template-jasmine-requirejs'),
					templateOptions: {
						requireConfig: {
							baseUrl: 'client/'
						}
					}
				}
			}
		},

		//// synchronizing the bower.json and package.json files

		sync: {
			include: ['name', 'version', 'main', 'description', 'author', 'license']
		},

		//// checking for circular dependencies between RequireJS modules

		madge: {
			options: { format: 'amd' },
			all:     PROJECT_JS_FILES
		},

		//// various automatic actions during development

		watch: {
			js:     {
				files: PROJECT_JS_FILES,
				tasks: ['madge']
			},
			scss:   {
				files: PROJECT_SCSS_FILES,
				tasks: ['compass:dev']
			},
			config: {
				files: ['package.json'],
				tasks: ['sync']
			}
		}
	});

	grunt.registerTask('dev', ['sync', 'madge', 'compass:dev', 'jasmine']);
	grunt.registerTask('dist', ['sync', 'madge', 'compass:dist', 'jasmine', 'uglify:dist']);

};
