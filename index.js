"use strict";

const PluginName = 'gulp-diamond-princess-zoning';
/**
 * https://qiita.com/morou/items/1297d5dd379ef013d46c
 *   gulpプラグインの基本構造（プラグイン開発者向け）
 */
const PluginError = require( 'plugin-error' ),
      Vinyl       = require( 'vinyl'        ),
      Through     = require( 'through2'     ),
      Path        = require( 'path'         );
/**
 * 
 */
module.exports = function( options ){
    const _options               = options || {},
          TEST_MODE              = _options.testData,
          FILE_LIST              = {},
          SRC_FILES              = TEST_MODE || {},
          BOM                    = String.fromCharCode( 65279 ),
          LABEL_GLOBAL           = _options.labelGlobal        || 'global',
          LABEL_PACKAGE_GLOBAL   = _options.labelPackageGlobal || 'packageGlobal',
          LABEL_MODULE_GLOBAL    = _options.labelModuleGlobal  || 'moduleGlobal',
          LABEL_TO_END_OF_SCRIPT = _options.toEndOfScript      || 'toEndOfScript',
          PACKAGE_GLOBAL_ARGS    = _options.packageGlobalArgs  || '',
          ES_MODULE_EXPORTS      = _options.esModuleExports    || false,
          OUTPUT_FILE_NAME       = _options.outputFilename     || 'output.js',
          WRAP_ALL               = _options.wrapAll,
          IS_MULTI_BASE_PATH     = Array.isArray( _options.basePath ),
          BASE_PATH              = _options.basePath || '';

    if( !IS_MULTI_BASE_PATH ){
        FILE_LIST[ '' ] = [];
    };

    function transform( file, encoding, callback ){
        if( TEST_MODE ) return callback();

        if( file.isNull() ) return callback();

        if( file.isStream() ){
            this.emit( 'error', new PluginError( PluginName, 'Streaming not supported' ) );
            return callback();
        };
        if( file.extname !== '.js' ){
            this.push( file );
            return callback();
        };

        var content = file.contents.toString( encoding ).split( '\r' ).join( '' ).split( BOM ).join( '' ), // Remove BOM
            projectBasePath = '',
            l = BASE_PATH.length, i = 0, path;

        if( content ){
            if( IS_MULTI_BASE_PATH ){
                path = Path.resolve( file.path );
                for( ; i < l; ++i ){
                    if( 0 === path.indexOf( Path.resolve( BASE_PATH[ i ] ) ) ){
                        if( projectBasePath ){
                            this.emit( 'error', new PluginError( PluginName, path + ' は複数の basePath に含まれます! ' + BASE_PATH ) );
                            return callback();
                        } else {
                            projectBasePath = BASE_PATH[ i ];
                            FILE_LIST[ projectBasePath ] = FILE_LIST[ projectBasePath ] || [];
                        };
                    };
                };
                if( !projectBasePath ){
                    this.emit( 'error', new PluginError( PluginName, path + ' を含める basePath がありません! ' + BASE_PATH ) );
                    return callback();
                };
            };
            FILE_LIST[ projectBasePath ].push( {
                    path    : Path.relative( Path.resolve( IS_MULTI_BASE_PATH ? projectBasePath : BASE_PATH ), file.path ),
                    content : content
                } );
        };
        callback();
    };

    function flush( callback ){
        var scriptsMoveToEnd = [],
            projectBasePath,
            i, texts = [], file,
            path, content, dirTransition, lastPath = '<dummy>.js',
            currentDepth = 0, wrap;

        // sort
        if( !TEST_MODE ){
            for( projectBasePath in FILE_LIST ){
                FILE_LIST[ projectBasePath ].sort( function( a, b ){ return a.path < b.path ? -1 : 1 } );
                for( i = -1; file = FILE_LIST[ projectBasePath ][ ++i ]; ){
                    // console.log( file.path );
                    SRC_FILES[ projectBasePath ] = SRC_FILES[ projectBasePath ] || {};
                    SRC_FILES[ projectBasePath ][ file.path ] = file.content;
                };
            };
        };

        // scriptsMoveToEnd
        for( projectBasePath in SRC_FILES ){
            for( path in SRC_FILES[ projectBasePath ] ){
                if( path.match( LABEL_TO_END_OF_SCRIPT ) ){
                    scriptsMoveToEnd.push( '// file:' + projectBasePath + '/' + path, SRC_FILES[ projectBasePath ][ path ] );
                    delete SRC_FILES[ projectBasePath ][ path ];
                };
            };
        };

        // global
        for( projectBasePath in SRC_FILES ){
            for( path in SRC_FILES[ projectBasePath ] ){
                if( LABEL_GLOBAL === '*' || path.match( LABEL_GLOBAL ) ){
                    texts.push( '// file:' + projectBasePath + '/' + path, SRC_FILES[ projectBasePath ][ path ] );
                    console.log( '// file:' + projectBasePath + '/' + path );
                    delete SRC_FILES[ projectBasePath ][ path ];
                };
            };
        };

        // packageGlobal, moduleGlobal, module imprementation
        if( ES_MODULE_EXPORTS ){
            if( ES_MODULE_EXPORTS === true ){
                texts.push(  'module.exports = function(' );
                console.log( 'module.exports = function(' );
            } else if( Array.isArray( ES_MODULE_EXPORTS ) ){
                texts.push(  '/** \n' + ES_MODULE_EXPORTS[ 0 ] + '\n */' );
                console.log( '/** \n' + ES_MODULE_EXPORTS[ 0 ] + '\n */' );
                texts.push(  'module.exports = function(' + ES_MODULE_EXPORTS[ 1 ] + '){' );
                console.log( 'module.exports = function(' + ES_MODULE_EXPORTS[ 1 ] + '){' );
            } else if( typeof ES_MODULE_EXPORTS === 'string' ){
                texts.push(  'module.exports = function(' + ES_MODULE_EXPORTS + '){' );
                console.log( 'module.exports = function(' + ES_MODULE_EXPORTS + '){' );
            };
        } else {
            texts.push(  '(function(' + ( Array.isArray( PACKAGE_GLOBAL_ARGS ) ? PACKAGE_GLOBAL_ARGS[ 0 ] : PACKAGE_GLOBAL_ARGS ) + '){' );
            console.log( '(function(' + ( Array.isArray( PACKAGE_GLOBAL_ARGS ) ? PACKAGE_GLOBAL_ARGS[ 0 ] : PACKAGE_GLOBAL_ARGS ) + '){' );
        };

        for( projectBasePath in SRC_FILES ){
            for( path in SRC_FILES[ projectBasePath ] ){
                content = SRC_FILES[ projectBasePath ][ path ];
                if( LABEL_PACKAGE_GLOBAL === '*' || path.match( LABEL_PACKAGE_GLOBAL ) ){
                    nestFunction( -currentDepth );
                    nestFunction( 0, content );
                } else {
                    dirTransition = comparePath( lastPath, path );
                    wrap = WRAP_ALL && !path.match( LABEL_MODULE_GLOBAL );

                    if( typeof dirTransition === 'number' ){
                        nestFunction( dirTransition, content, wrap );
                    } else {
                        nestFunction( - dirTransition.up );
                        nestFunction( dirTransition.down, content, wrap );
                    };
                };
                lastPath = path;
            };
            nestFunction( -currentDepth );
        };

        // scriptsMoveToEnd
        for( ; scriptsMoveToEnd.length; ){
            console.log( scriptsMoveToEnd[ 0 ] );
            texts.push( scriptsMoveToEnd.shift(), scriptsMoveToEnd.shift() );
        };

        if( ES_MODULE_EXPORTS ){
            if( ES_MODULE_EXPORTS === true || Array.isArray( ES_MODULE_EXPORTS ) || typeof ES_MODULE_EXPORTS === 'string' ){
                texts.push(  '};' );
                console.log( '};' );
            };
        } else {
            texts.push(  '})(' + ( Array.isArray( PACKAGE_GLOBAL_ARGS ) ? PACKAGE_GLOBAL_ARGS[ 1 ] : PACKAGE_GLOBAL_ARGS ) + ');' );
            console.log( '})(' + ( Array.isArray( PACKAGE_GLOBAL_ARGS ) ? PACKAGE_GLOBAL_ARGS[ 1 ] : PACKAGE_GLOBAL_ARGS ) + ');' );
        };

        function comparePath( oldPath, newPath ){
            var oldPathElms = oldPath.split( TEST_MODE ? '/' : Path.sep ),
                newPathElms = newPath.split( TEST_MODE ? '/' : Path.sep ),
                oldDirLen   = oldPathElms.length,
                newDirLen   = newPathElms.length;

            if( oldPath.match( LABEL_MODULE_GLOBAL ) ){
                oldPathElms.splice( 2, oldPathElms.length - 2 );
                oldDirLen = 1;
            } else {
                --oldDirLen;
            };

            if( newPath.match( LABEL_MODULE_GLOBAL ) ){
                newPathElms.splice( 2, newPathElms.length - 2 );
                newDirLen = 1;
            } else {
                --newDirLen;
            };

            if( currentDepth === 0 ) return newDirLen;

            for( var i = 0; i < Math.min( newDirLen, oldDirLen ); ++i ){
                if( oldPathElms[ i ] !== newPathElms[ i ] ){
                    return { up : oldDirLen - i, down : newDirLen - i };
                };
            };
            return i ? ( newDirLen - oldDirLen ) : { up : oldDirLen, down : newDirLen };
        };

        function nestFunction( depth, content, wrap ){
            var targetDepth = currentDepth + depth;

            content = content || '';

            if( targetDepth < 0 ) this.emit( 'error', new PluginError( PluginName, 'Nesting error!' ) );

            if( 0 < depth ){
                for( ++currentDepth; currentDepth <= targetDepth; ++currentDepth ){
                    texts.push( '(function(){' );
                    console.log( tab( currentDepth ) + '(function(){ ' );
                };
            };

            content && texts.push( '// file:' + projectBasePath + '/' + path );
            if( wrap ){
                texts.push( '(function(){', content, '})();' );
                console.log( tab( targetDepth + 1 ) + '(function(){ /* ', projectBasePath + path, ' */ })();' );
            } else if( content ){
                texts.push( content );
                console.log( tab( targetDepth + 1 ) + '// file:' + projectBasePath + '/' + path );
            };

            if( depth < 0 ){
                for( ; targetDepth < currentDepth; --currentDepth ){
                    texts.push( '})();' );
                    console.log( tab( currentDepth ) + '})();' );
                };
            };
            currentDepth = targetDepth;
        };

        function tab( depth ){
            var str = '    ';

            while( 0 < ( --depth ) ) str += '    ';
            return str;
        };

        if( TEST_MODE ){
            // console.log( texts.join( '\n' ) );
        } else {
            this.push(new Vinyl({
                // base     : '/',
                path     : OUTPUT_FILE_NAME,
                contents : Buffer.from( texts.join( '\n' ) )
            }));
        };

        callback();
    };

    return Through.obj( transform, flush );
};