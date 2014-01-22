module.exports = function(grunt) {

	var banner = 
				'/*!\n' +
				' * pbPlayer v<%= pkg.version %>\n' +
				' * https://github.com/Pluxbox/pbPlayer\n' +
				' *\n' +
				' * Requires pbjs javascript framework (>= 0.6.0)\n' +
				' * https://github.com/Saartje87/pbjs-0.6\n' +
				' *\n' +
				' * Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
		        ' * Licensed <%= pkg.license %>\n' +
				' *\n' +
				' * Build date <%= grunt.template.today("yyyy-mm-dd HH:MM") %>\n' +
				' */\n';

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		// Concat
		concat: {
			options: {

				banner: banner
			},
			dist: {

				src: ['<banner>', 

					'src/intro.js',

					// Core
					'src/utils.js',
					'src/pbplayer.js',
					'src/pbplayer-static.js',

					// Playlist
					'src/playlist/playlist.js',

					// Media containers
					'src/container/html5/html5.js',
					'src/container/flash/flash.js',
					'src/container/simple-dash/manifest.js',
					'src/container/simple-dash/simple-dash.js',

					// Outro
					'src/outro.js'
				],
				dest: 'dist/pbplayer.js'
			}
		},
		jshint: {

			options: {
                jshintrc: '.jshintrc'
            },
            afterconcat: ['dist/pbplayer.js']
		},
		// Uglify
		uglify: {

			options: {

				report: 'gzip',
				preserveComments: 'some'
			},
			build: {

				src: ["dist/pbplayer.js"],
				dest: "dist/pbplayer.min.js"
			}
		},
		watch: {
			scripts: {
				files: ['**/*.js'],
				tasks: ['default'],
				options: {
					//nospawn: true,
				},
			},
		},
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Default task(s).
	grunt.registerTask('default', ['concat', 'uglify']);
	grunt.registerTask('test', ['jshint']);

};
