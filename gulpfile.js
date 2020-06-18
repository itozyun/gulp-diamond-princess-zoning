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
                        wrapAll            : true,
                        testData           : {
                            'global.js'                  : 'var Util = {};',
                            'packageGlobal.js'           : 'var TEMP = {};',
                            'ajaxModule/moduleGlobal.js' : 'var ajaxCommon;',
                            'ajaxModule/XHR.js'          : 'if( window.XMLHttpRequest ){}',
                            'ajaxModule/fetch.js'        : 'if( window.fetch ){}',
                            'domModule/moduleGlobal.js'  : 'var domCommon;',
                            'domModule/DOM0.js'          : 'if( document.all ){}',
                            'domModule/DOM1.js'          : 'if( document.getElementsByTagName ){}',
                            'domModule/patch/ieFilter.js': 'if( UA.IE < 9 ){}',
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
                        basePath           : 'testPackageProject',
                        wrapAll            : true,
                    }
                )
            )
            .pipe(gulp.dest( 'R:/d' ));
    }
);