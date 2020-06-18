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
                        // wrapAll            : true,
                        testData           : {
                            'global.js'                  : 'var Util = {};',
                            // 'packageGlobal.js'           : 'var TEMP = {};',
                            'domModule/moduleGlobal.js'  : 'var domCommon;',
                            'domModule/DOM0.js'          : 'if( document.all ){}',
                            'domModule/DOM1.js'          : 'if( document.getElementsByTagName ){}',
                            'domModule/patch/ieFilter.js': 'if( UA.IE < 9 ){}',
                            'domModule/patch2/ieFilter2.js': 'if( UA.IE < 9 ){}',
                            'domModule/patch2/_/ieFilter3.js': 'if( UA.IE < 9 ){}',
                            'ajaxModule/moduleGlobal.js' : 'var ajaxCommon;',
                            'ajaxModule/XHR.js'          : 'if( window.XMLHttpRequest ){}',
                            'ajaxModule/fetch.js'        : 'if( window.fetch ){}',
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