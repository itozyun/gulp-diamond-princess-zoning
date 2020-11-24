# gulp-diamond-princess-zoning

![zoning](./gdpz.jpg)

---

js ファイルを一本化しつつ、ファイル名やフォルダ名を元に `(function(){ ... })()` でラップする gulp プラグインです。

1. レガシーなゾーニングによって、js パッケージの変数と関数の宣言に制約を設けます
2. モジュール毎にスコープを作ることで、変数と関数へのアクセスを高速化します

## 背景

アプリケーションを構成する各モジュール間の通信には、イベントやメッセージを使って、見通し良く、再利用性の高いコーディングをすることが一般的です。しかし、これはコストとトレードオフです。

最もローコストなモジュール間通信は、グローバル変数やグローバル関数を介したものです。しかしこの手法は前出のメリットを失い、スパゲッティなコード塊となる危険と隣り合わせです。

とはいえ Web プログラミングに於いてはクライアントのマシンリソースが不明である点から、可能な限りローコストな手法を採用したいところです。

このプラグインでは、ファイル名やフォルダ名と変数と関数の宣言場所の制約によって危険を退け、コードの堅牢性の維持を狙います。

## 用語

| Name          | description |
|:--------------|:------------|
| package       | フレームワークやライブラリ集、ゲームエンジン、アプリケーションといった粒度の単位 |
| global        | パッケージの外に公開する、グローバル変数とグローバル関数 |
| packageGlobal | パッケージに所属するモジュール群で共有するグローバル変数とグローバル関数 |
| module        | パッケージに所属する、コードブロック群の単位 |
| moduleGlobal  | モジュールに所属するコード群で共有するグローバル変数とグローバル関数 |

## 例

### コード例

~~~js
gulp.task( 'precompile',
    function( cb ){
        return gulp.src( 'myUtilProject/**/*.js' )
            .pipe(
                gulpDPZ(
                    {
                        labelGlobal        : 'global',
                        labelPackageGlobal : 'packageGlobal',
                        labelModuleGlobal  : 'moduleGlobal',
                        basePath           : 'myUtilProject'
                    }
                )
            )
            .pipe(gulp.dest( 'R:/d' ));
    }
);
~~~

### プロパティ

| Name               | default value     | description |
|:-------------------|:------------------|:------------|
| labelGlobal        | `'global'`        | `Vinyl.prototype.path` に match する文字列 |
| labelPackageGlobal | `'packageGlobal'` | `Vinyl.prototype.path` に match する文字列 |
| labelModuleGlobal  | `'moduleGlobal'`  | `Vinyl.prototype.path` に match する文字列 |
| outputFilename     | `'output.js'`     |  |
| basePath           | `'src'`           |  |
| wrapAll            | `false`           |  |

### 各ファイルの内容

~~~js
// myUtilProject/global.js
var Util = {};

// myUtilProject/packageGlobal.js
var TEMP = {};

// myUtilProject/ajaxModule/modulebGlobal.js
var ajaxCommon;

// myUtilProject/ajaxModule/XHR.js
if( window.XMLHttpRequest ){}

// myUtilProject/ajaxModule/Fetch.js
if( window.fetch ){}
~~~

### output

~~~js
// myUtilProject/global.js
var Util = {};

(function(){
    // myUtilProject/packageGlobal.js
    var TEMP = {};

    (function(){
        // myUtilProject/ajaxModule/modulebGlobal.js
        var ajaxCommon;

        // myUtilProject/ajaxModule/XHR.js
        if( window.XMLHttpRequest ){}

        // myUtilProject/ajaxModule/Fetch.js
        if( window.fetch ){}
    })();
})();
~~~

## wrapAll

モジュール下の各ファイルを `(function(){})()` でラップするのは、テスト用途です。共用の変数や関数を適切に moduleGlobal に記述していない場合、例えば Clodure Compiler 等でエラーが出ます。

深すぎる function の入れ子は、Presto Opera で不具合に遭遇した(*1)ことがある為、避けます。

1. [Opera 9 ～ 11 で動かない問題．](https://ja.osdn.net/projects/pettanr/wiki/ItoZyun)

~~~js
// myUtilProject/global.js
var Util = {};

(function(){
    // myUtilProject/packageGlobal.js
    var TEMP = {};

    (function(){
        // myUtilProject/ajaxModule/modulebGlobal.js
        var ajaxCommon;

        (function(){
            // myUtilProject/ajaxModule/XHR.js
            if( window.XMLHttpRequest ){}
        })();
        (function(){
            // myUtilProject/ajaxModule/Fetch.js
            if( window.fetch ){}
        })();
    })();
})();
~~~