module.exports = function (grunt) {

	//// loading grunt plugins
	//
	[ 'grunt-contrib-compass',
	  'grunt-contrib-uglify',
	  'grunt-contrib-jasmine',
	  'grunt-contrib-watch',
	  'grunt-sync-pkg',
	  'grunt-madge',
	  'grunt-typescript',
	  'grunt-shell',
	  'grunt-tsd'
	].map(grunt.loadNpmTasks);


	//// constants
	//
	var BANNER = '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n';
	var PROJECT_JS_FILES = ['client/**/*.js', '!client/lib/**/*.*'];
	var PROJECT_SPEC_JS_FILES = ['spec/**/*-spec.js', 'node_modules/jasmine-expect/dist/jasmine-matchers.js'];
	var PROJECT_SPEC_HELPER_JS_FILES = ['spec/**/*-helper.js'];
	var PROJECT_SCSS_FILES = ['client/**/*.scss', '!client/lib/**/*.*'];
	var PROJECT_TS_FILES = ['client/**/*.ts', '!client/lib/**/*.*'];


	//// main configuration block
	//
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),


		//// transpiling from .scss to .css
		//
		compass: {
			options: {
				specify:    PROJECT_SCSS_FILES,
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


		//// transpiling from .ts to .js
		//
		typescript: {
			options: {
				basePath: 'client',
				module: 'amd',
				target: 'es5',
				sourceMap: true,
				declaration: true
			},
			dev:     {
				src: PROJECT_TS_FILES,
				options: {
					comments: true
				}
			},
			dist:    {
				src: PROJECT_TS_FILES,
				options: {
					comments: false
				}
			}
		},


		//// minification
		//
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
		//
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
		//
		sync: {
			include: ['name', 'version', 'main', 'description', 'author', 'license']
		},


		//// checking for circular dependencies between RequireJS modules
		//
		madge: {
			options: { format: 'amd' },
			all:     PROJECT_JS_FILES
		},


		//// shell commands
		//
		shell: {

			//// generate AMD versions of the jquery-ui modules
			//
			jqueryUiAmd: {
				command: "./node_modules/.bin/jqueryui-amd client/lib/jquery-ui"
			}
		},


		//// DefinitelyTyped Typescript definition reinstall
		//
		tsd: {
			reinstall: {
				options: {
					command: 'reinstall',
					latest: true,
					config: 'tsd.json'
				}
			}
		},


		//// various automatic actions during development
		//
		watch: {
			compass:   {
				files: PROJECT_SCSS_FILES,
				tasks: ['compass:dev'],
				options: { spawn: false }
			},
			typescript:   {
				files: PROJECT_TS_FILES,
				tasks: ['typescript:dev'],
				options: { spawn: false }
			},
			js:     {
				files: PROJECT_JS_FILES,
				tasks: ['madge']
			},
			config: {
				files: ['package.json'],
				tasks: ['sync']
			}
		}

	});


	//// for 'watch', use given transpiler only on the changed file
	//
	grunt.event.on('watch', function (action, filepath) {
		grunt.config('compass.options.specify', filepath);
		grunt.config('typescript.dev.src', filepath);
	});


	//// exposed tasks
	//
	grunt.registerTask('dev', ['sync', 'tsd:reinstall', 'shell:jqueryUiAmd', 'madge', 'compass:dev', 'jasmine']);
	grunt.registerTask('dist', ['sync', 'tsd:reinstall', 'shell:jqueryUiAmd', 'madge', 'compass:dist', 'jasmine', 'uglify:dist']);

};
