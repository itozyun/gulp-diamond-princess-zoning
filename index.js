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
    const _options             = options || {},
          TEST_MODE            = _options.testData,
          FILE_LIST            = [],
          SRC_FILES            = TEST_MODE || {},
          BOM                  = String.fromCharCode( 65279 ),
          LABEL_GLOBAL         = _options.labelGlobal        || 'global',
          LABEL_PACKAGE_GLOBAL = _options.labelPackageGlobal || 'packageGlobal',
          LABEL_MODULE_GLOBAL  = _options.labelModuleGlobal  || 'moduleGlobal',
          PACKAGE_GLOBAL_ARGS  = _options.packageGlobalArgs  || '',
          OUTPUT_FILE_NAME     = _options.outputFilename     || 'output.js',
          WRAP_ALL             = _options.wrapAll,
          BASE_PATH            = TEST_MODE ? _options.basePath : Path.resolve( _options.basePath || 'src' );

    function transform( file, encoding, callback ){
        if( TEST_MODE ){
            return callback();
        };

        if( file.isNull() ){
            // this.push( file );
            return callback();
        };
        if( file.isStream() ){
            this.emit( 'error', new PluginError( PluginName, 'Streaming not supported' ) );
            return callback();
        };
        if( file.extname !== '.js' ){
            this.push( file );
            return callback();
        };

        var content = file.contents.toString( encoding ).split( '\r' ).join( '' ).split( BOM ).join( '' ); // Remove BOM

        if( content ){
            FILE_LIST.push( { path : Path.relative( BASE_PATH, file.path ), content : content } );
        };
        callback();
    };

    function flush( callback ){
        var i = -1, texts = [], file,
            path, content, dirTransition, lastPath = '<dummy>.js',
            currentDepth = 0, dirDepth = 0, wrap;

        // sort
        if( !TEST_MODE ){
            FILE_LIST.sort( function( a, b ){ return a.path < b.path ? -1 : 1 } );
            for( ; file = FILE_LIST[ ++i ]; ){
                // console.log( file.path );
                SRC_FILES[ file.path ] = file.content;
            };
        };

        // global
        for( path in SRC_FILES ){
            if( path.match( LABEL_GLOBAL ) ){
                texts.push( '// file:' + path, SRC_FILES[ path ] );
                console.log( '// file:' + path );
                delete SRC_FILES[ path ];
            };
        };

        // packageGlobal, moduleGlobal, module imprementation
        texts.push( '(function(' + PACKAGE_GLOBAL_ARGS + '){' );
        console.log( '(function(' + PACKAGE_GLOBAL_ARGS + '){' );

        for( path in SRC_FILES ){
            content = SRC_FILES[ path ];
            if( path.match( LABEL_PACKAGE_GLOBAL ) ){
                nestFunction( -currentDepth, content );
            } else {
                dirTransition = comparePath( lastPath, path );
                wrap = WRAP_ALL && !path.match( LABEL_MODULE_GLOBAL );

                if( typeof dirTransition === 'number' ){
                    nestFunction( currentDepth ? dirTransition : dirDepth, content, wrap );
                } else {
                    // console.log( '// crt:' + currentDepth + ' ↑' + dirTransition.up + ' ↓' + dirTransition.down );
                    if( currentDepth ){
                        nestFunction( - dirTransition.up );
                        nestFunction( dirTransition.down, content, wrap );
                    } else {
                        nestFunction( dirDepth, content, wrap );
                    };
                };
            };
            lastPath = path;
        };
        nestFunction( -currentDepth );
        texts.push( '})(' + PACKAGE_GLOBAL_ARGS + ');' );
        console.log( '})(' + PACKAGE_GLOBAL_ARGS + ');' );

        function comparePath( oldPath, newPath ){
           var oldPathElms = oldPath.split( TEST_MODE ? '/' : Path.sep ),
               newPathElms = newPath.split( TEST_MODE ? '/' : Path.sep ),
               oldDirLen   = oldPathElms.length - 1,
               newDirLen   = dirDepth = newPathElms.length - 1,
               i = 0;

            for( ; i < Math.min( newDirLen, oldDirLen ); ++i ){
                if( oldPathElms[ i ] !== newPathElms[ i ] ){
                    return { up : oldDirLen - i, down : newDirLen - i };
                };
            };
            return i ? ( newDirLen - oldDirLen ) : { up : oldDirLen, down : newDirLen };
        };

        function nestFunction( depth, content, wrap ){
            content = content || '';
            currentDepth += depth;

            if( currentDepth < 0 ) this.emit( 'error', new PluginError( PluginName, 'Nesting error!' ) );

            if( 0 < depth ){
                for( ; depth; --depth ){
                    texts.push( '(function(){' );
                    console.log( '(function(){' );
                };
            };
            content && texts.push( '// file:' + path );
            if( wrap ){
                texts.push( '(function(){', content, '})();' );
                console.log( '(function(){ /* ', path, ' */ })();' );
            } else if( content ){
                texts.push( content );
                console.log( '// file:' + path );
            };
            if( depth < 0 ){
                for( ; depth; ++depth ){
                    texts.push( '})();' );
                    console.log( '})();' );
                };
            };
        };

        if( TEST_MODE ){
            console.log( texts.join( '\n' ) );
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