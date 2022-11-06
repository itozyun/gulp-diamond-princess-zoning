const gulp    = require( 'gulp' ),
      gulpDPZ = require( './index.js' ),
      tempDir = require('os').tmpdir() + '/gulpDPZ';

gulp.task( 'test1',
    function( cb ){
        gulp.src( '*.js' )
            .pipe(
                gulpDPZ(
                    {
                        labelGlobal        : 'global',
                        labelPackageGlobal : 'packageGlobal',
                        labelModuleGlobal  : 'moduleGlobal',
                        packageGlobalArgs  : 'window,document',
                        basePath           : 'src',
                        // wrapAll            : true,
                        testData           : {
                            '' : {
                                'global.js'                  : 'var Util = {};',
                                'packageGlobal.js'           : 'var TEMP = {};',
                                'domModule/moduleGlobal.js'  : 'var domCommon;',
                                'domModule/DOM0.js'          : 'if( document.all ){}',
                                'domModule/DOM1.js'          : 'if( document.getElementsByTagName ){}',
                                'domModule/patch/ieFilter.js': 'if( UA.IE < 9 ){}',
                                'domModule/patch2/ieFilter2.js': 'if( UA.IE < 9 ){}',
                                'domModule/patch2/_/ieFilter3.js': 'if( UA.IE < 9 ){}',
                                'ajaxModule/moduleGlobal.js' : 'var ajaxCommon;',
                                'ajaxModule/XHR.js'          : 'if( window.XMLHttpRequest ){}',
                                'ajaxModule/fetch.js'        : 'if( window.fetch ){}'
                            }
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
                        packageGlobalArgs  : 'window,document',
                        wrapAll            : true,
                    }
                )
            )
            .pipe(gulp.dest( tempDir ));
    }
);

gulp.task( 'test3',
    function( cb ){
        gulp.src( '*.js' )
            .pipe(
                gulpDPZ(
                    {
                        labelGlobal        : 'global',
                        labelPackageGlobal : 'packageGlobal',
                        labelModuleGlobal  : 'moduleGlobal',
                        packageGlobalArgs  : 'window,document',
                        basePath           : [ 'MyProjects/projectA/src/js/', 'MyProjects/projectB/src/js/' ],
                        // wrapAll            : true,
                        testData           : {
                            'MyProjects/projectA/src/js/' : {
                                'global.js'                       : 'var g_Util = {};',
                                'packageGlobal.js'                : 'var pG$projectA_TEMP = {};',
                                'domModule/moduleGlobal/var.js'   : 'var mG_state = 0;',
                                'domModule/moduleGlobal/CONST.js' : 'var mG_LIST = [];',
                                'domModule/moduleGlobal.js'       : 'var mG_domCommon;',
                                'domModule/DOM0.js'               : 'if( document.all ){}',
                                'domModule/DOM1.js'               : 'if( document.getElementsByTagName ){}',
                                'domModule/patch/ieFilter.js'     : 'if( UA.IE < 9 ){}',
                                'domModule/patch2/ieFilter2.js'   : 'if( UA.IE < 9 ){}',
                                'domModule/patch2/_/ieFilter3.js' : 'if( UA.IE < 9 ){}',
                                'ajaxModule/moduleGlobal.js'      : 'var mG_ajaxCommon;',
                                'ajaxModule/XHR.js'               : 'if( window.XMLHttpRequest ){}',
                                'ajaxModule/fetch.js'             : 'if( window.fetch ){}'
                            },
                            'MyProjects/projectB/src/js/' : {
                                'global.js'                       : 'var g_Framework = {};',
                                'packageGlobal.js'                : 'var pG$projectB_CACHE = {};',
                                'modalWindow/moduleGlobal.js'     : 'var mG_modalWindowCommon;',
                                'modalWindow/manager.js'          : 'var modalWindowManager;',
                                'modalWindow/modalWindowClass.js' : 'var ModalWindowClass;'
                            }
                        }
                    }
                )
            );
        cb();
    }
);