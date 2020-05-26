const gulp    = require( 'gulp' ),
      gulpDPZ = require( './index.js' );

gulp.task( 'test',
    function( cb ){
        gulp.src( '*.js' )
            .pipe(
                gulpDPZ(
                    {
                        labelGlobal        : 'global',
                        labelPackageGlobal : 'packageGlobal',
                        labelModuleGlobal  : 'moduleGlobal',
                        basePath           : 'src',
                        testData           : {
                            'src/global.js'                  : 'var Util = {};',
                            'src/packageGlobal.js'           : 'var TEMP = {};',
                            'src/ajaxModule/moduleGlobal.js' : 'var ajaxCommon;',
                            'src/ajaxModule/XHR.js'          : 'if( window.XMLHttpRequest ){}',
                            'src/ajaxModule/fetch.js'        : 'if( window.fetch ){}',
                            'src/domModule/moduleGlobal.js'  : 'var domCommon;',
                            'src/domModule/DOM0.js'          : 'if( document.all ){}',
                            'src/domModule/DOM1.js'          : 'if( document.getElementsByTagName ){}',
                            'src/domModule/patch/ieFilter.js': 'if( UA.IE < 9 ){}',
                        }
                    }
                )
            );
        cb();
    }
);

gulp.task( 'test2',
    function( cb ){
        return gulp.src( 'testPackageProject/**/*.js' )
            .pipe(
                gulpDPZ(
                    {
                        labelGlobal        : 'global',
                        labelPackageGlobal : 'packageGlobal',
                        labelModuleGlobal  : 'moduleGlobal',
                        basePath           : 'testPackageProject'
                    }
                )
            )
            .pipe(gulp.dest( 'R:/d' ));
    }
);