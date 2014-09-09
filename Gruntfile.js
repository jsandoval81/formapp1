
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        //=====================================
        //== Run blocking tasks concurrently ==
        //=====================================
        concurrent: {
            //== Automate the dev environment
            dev: {
                options: {
                    logConcurrentOutput: true
                },
                tasks: ['watch', 'nodemon:dev']
            }
        },

        //======================
        //== Node app control ==
        //======================
        nodemon: {
            //== Monitor the dev Node app for Node file updates
            dev: {
                script: './bin/www',
                options: {
                    ignore: [ '.git/**',
                              'node_modules/**',
                              'public/**',
                              'test/**',
                              'Gruntfile.js',
                              'npm_debug.log',
                              'README.md'
                            ]
                }
            }
        },

        //=================
        //== Watch files ==
        //=================
        watch: {
            //== Rebuild the CSS min file after CSS edits
            css: {
                files: ['public/stylesheets/*.css', '!public/stylesheets/application.css', '!public/stylesheets/application.min.css'],
                tasks: ['concat:css', 'cssmin'],
                options: {
                    spawn: false
                }
            },
            //== Rebuild the JS min file after JS edits
            js: {
                files: ['public/javascripts/*.js', '!public/javascripts/application.js', '!public/javascripts/application.min.js'],
                tasks: ['concat:js', 'uglify'],
                options: {
                    spawn: false
                }
            }
        },

        //========================
        //== File concatination ==
        //========================
        concat: {
            //== Concat the CSS files
            css: {
                src: [
                    'public/stylesheets/jquery-ui.css',
                    'public/stylesheets/bootstrap.min.css',
                    'public/stylesheets/bootstrap-theme.min.css',
                    'public/stylesheets/jquery-modal.css',
                    'public/stylesheets/jquery-tagsinput.css',
                    'public/stylesheets/style.css',
                    'public/stylesheets/style-mq.css'
                ],
                dest: 'public/stylesheets/application.css'
            },
            //== Concat the JS files
            js: {
                src: [
                    'public/javascripts/purl.js',
                    'public/javascripts/jquery-awesome-cloud.min.js',
                    'public/javascripts/jquery-modal.min.js',
                    'public/javascripts/jquery-tagsinput.js',
                    'public/javascripts/script.js'
                ],
                dest: 'public/javascripts/application.js'
            }
        },

        //======================
        //== CSS minification ==
        //======================
        cssmin: {
            minify: {
                expand: true,
                cwd:   'public/stylesheets/',
                src:  ['application.css'],
                dest:  'public/ti/stylesheets/',
                ext:   '.min.css'
            }
        },

        //=============================
        //== Javascript minification ==
        //=============================
        uglify: {
            build: {
                src:  'public/javascripts/application.js',
                dest: 'public/ti/javascripts/application.min.js'
            }
        },

        //=========================================
        //== Clear the Production-like directory ==
        //=========================================
        clean: {
            options: { force: true },
            prod:    ['../../production/ti']
        },

        //====================================================
        //== Copy server files to Production-like directory ==
        //====================================================
        copy: {
            //== Node server files
            auth: {
                expand: true,
                src:    'auth/**',
                dest:   '../../production/ti/'
            },
            bin: {
                expand: true,
                src:    'bin/**',
                dest:   '../../production/ti/'
            },
            controllers: {
                expand: true,
                src:    'controllers/**',
                dest:   '../../production/ti/'
            },
            helpers: {
                expand: true,
                src:    'helpers/**',
                dest:   '../../production/ti/'
            },
            models: {
                expand: true,
                src:    'models/**',
                dest:   '../../production/ti/'
            },
            routes: {
                expand: true,
                src:    'routes/**',
                dest:   '../../production/ti/'
            },
            views: {
                expand: true,
                src:    'views/**',
                dest:   '../../production/ti/'
            },
            appjs: {
                expand: true,
                src:    'app.js',
                dest:   '../../production/ti/'
            },
            pkgjson: {
                expand: true,
                src:    'package.json',
                dest:   '../../production/ti/'
            },
            //== Asset files
            images: {
                expand: true,
                cwd:    'public/ti/images/',
                src:    '**',
                dest:   '../../production/ti/public/images/'
            },
            applicationcss: {
                expand: true,
                cwd:    'public/ti/stylesheets/',
                src:    'application.min.css',
                dest:   '../../production/ti/public/stylesheets/'
            },
            applicationjs: {
                expand: true,
                cwd:    'public/ti/javascripts/',
                src:    'application.min.js',
                dest:   '../../production/ti/public/javascripts/'
            },
            bootstrapjs: {
                expand: true,
                cwd:    'public/ti/javascripts/',
                src:    'bootstrap.min.js',
                dest:   '../../production/ti/public/javascripts/'
            },
            jquery: {
                expand: true,
                cwd:    'public/ti/javascripts/',
                src:    'jquery-2.1.1.min.js',
                dest:   '../../production/ti/public/javascripts/'
            },
            jqueryui: {
                expand: true,
                cwd:    'public/ti/javascripts/',
                src:    'jquery-ui.min.js',
                dest:   '../../production/ti/public/javascripts/'
            }
        },
 
        //====================
        //== Shell commands ==
        //====================
        shell: {
            //== Run NPM install in Production-like directory (Evening)
            prodNpmInstalleve: {
                command: [
                    'cd C:/Users/Sandoval/Desktop/Development/John/Javascript/production/ti',
                    'npm cache clean',
                    'npm install --production'
                ].join('&&')
            },
            //== Run NPM install in Production-like directory (Daylight)
            prodNpmInstallday: {
                command: [
                    'cd C:/Users/jsandoval/Desktop/Development/Javascript/production/ti',
                    'npm cache clean',
                    'npm install --production'
                ].join('&&')
            }
        }

    });

    //=============================
    //== Load Grunt NPM packages ==
    //=============================
    require('load-grunt-tasks')(grunt);

    //====================
    //== Register tasks ==
    //====================
    //== Default task (blank for now)
    grunt.registerTask('default', ['']);
    //== Dev task (Automate the dev environment)
    grunt.registerTask('dev', ['concurrent:dev']);
    //== Production build (Create fresh production-like build)
    grunt.registerTask('build-evening',  ['concat', 'cssmin', 'uglify', 'clean', 'copy', 'shell:prodNpmInstalleve']);
    grunt.registerTask('build-daylight', ['concat', 'cssmin', 'uglify', 'clean', 'copy', 'shell:prodNpmInstallday']);
};