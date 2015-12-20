// Based on code from:
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

/*
 * Edited by Sergio Tomasello for Arduino Studio.
 * sergio@arduino.org 09 Dec 2015
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, regexp: true */
/*global define, brackets */

/**
 * Patches/extensions to the default CodeMirror clike mode:
 * 
 * - Create CodeMirror mimetype for Objective-C++, cominbing elements of Objective-C & C++ mimetypes
 * 
 */
define(function (require, exports, module) {
    "use strict";
    
    var _                   = brackets.getModule("thirdparty/lodash"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        TokenUtils          = brackets.getModule("utils/TokenUtils"),
        AppInit             = brackets.getModule("utils/AppInit"),
        CodeMirror          = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        FileSystem          = brackets.getModule("filesystem/FileSystem"),
        ArduinoOs           = brackets.getModule("arduino/Os"),
        FileUtils           = brackets.getModule("file/FileUtils");
    
    
    function toMap(str) {
        var obj = {};
        str.split(" ").forEach(function (word) {
            obj[word] = true;
        });
        return obj;
    }
    
    // (unmodified from CodeMirror clike mode)
    function cppHook(stream, state) {
        if (!state.startOfLine) { return false; }
        for (;;) {
            if (stream.skipTo("\\")) {
                stream.next();
                if (stream.eol()) {
                    state.tokenize = cppHook;
                    break;
                }
            } else {
                stream.skipToEnd();
                state.tokenize = null;
                break;
            }
        }
        return "meta";
    }
    
    // (unmodified from CodeMirror clike mode)
    function tokenRawString(stream, state) {
        // Escape characters that have special regex meanings.
        var delim = state.cpp11RawStringDelim.replace(/[^\w\s]/g, '\\$&');
        var match = stream.match(new RegExp(".*?\\)" + delim + '"'));
        if (match) {
            state.tokenize = null;
        } else {
            stream.skipToEnd();
        }
        return "string";
    }
    
    // (unmodified from CodeMirror clike mode)
    function cpp11StringHook(stream, state) {
        stream.backUp(1);
        // Raw strings.
        if (stream.match(/(R|u8R|uR|UR|LR)/)) {
            var match = stream.match(/"([^\s\\()]{0,16})\(/);
            if (!match) {
                return false;
            }
            state.cpp11RawStringDelim = match[1];
            state.tokenize = tokenRawString;
            return tokenRawString(stream, state);
        }
        // Unicode strings/chars.
        if (stream.match(/(u8|u|U|L)/)) {
            if (stream.match(/["']/, /* eat */ false)) {
                return "string";
            }
            return false;
        }
        // Ignore this hook.
        stream.next();
        return false;
    }

    var cKeywords = "auto if break int case long char register continue return default short do sizeof " +
        "double static else struct entry switch extern typedef float union for unsigned " +
        "goto while enum void const signed volatile";
    var cppKeywords = " asm dynamic_cast namespace reinterpret_cast try bool explicit new " +
        "static_cast typeid catch operator template typename class friend private " +
        "this using const_cast inline public throw virtual delete mutable protected " +
        "wchar_t alignas alignof constexpr decltype nullptr noexcept thread_local final " +
        "static_assert override";
    //var objcKeywords = "inline restrict _Bool _Complex _Imaginery BOOL Class bycopy byref id IMP in " +
    //    "inout nil oneway out Protocol SEL self super atomic nonatomic retain copy readwrite readonly";

    var arduinoKeywords = "", //READ FROM FILE
        hintwords = [],
        isKeyword = false,
        libraryKeys = [],
        libraryPaths = [],
        constants = {
            "HIGH": true,
            "LOW": true,
            "INPUT": true,
            "OUTPUT": true,
            "INPUT_PULLUP": true,
            "LED_BUILTIN": true
        };

    /**
     * Arduino Libraries Path
     * @type {string}
     * @private
     */
    var _arduinoLibPath = "";

    /**
     * Arduino User Libraries Path
     * @type {string}
     * @private
     */
    var _usrLibPath = "";

    ArduinoOs.getUserArduinoLibrariesDir().done(function(path){
        _usrLibPath = path.fullPath;
    });

    ArduinoOs.getArduinoHomeLibrariesDir().done(function(path){
        _arduinoLibPath = path.fullPath;
    });

    var isOperatorChar = /[+\-*&^%:=<>!|\/]/;
    var curPunc;

    //Get Arduino Words
    var keywords = JSON.parse(require('text!arduinoHints.json'));
    for (var i in keywords) {
        arduinoKeywords += " " + i.substring(0, i.lastIndexOf("|")-1)
        //arduinoKeywords.push(i.substring(0, i.lastIndexOf("|")-1));
        hintwords.push(i);
    }

    /**** by this way the keywords of the #include libs are highlited ***/
    // TODO: 1 read all the dir in '_arduinoLibPath' and '_usrLibPath'
    // TODO: 2 check for keywords.txt file and extract keywords via 'extractKeywords'.
    // TODO: 3 then add the keywords into 'arduinoKeywords'
    // TODO: 4 finally call 'defineMIME' with all keywords.

    // TODO: find a way to update the keywords dinamically, specially in the 'Add Library' features
    /**** ****/

    CodeMirror.defineMIME("text/x-arduino", {
        name: "clike",
        keywords: toMap(cKeywords + cppKeywords + arduinoKeywords),
        atoms: toMap("YES NO NULL NILL ON OFF true false null"),
        blockKeywords: toMap("catch class do else finally for if struct switch try while"),
        hooks: {
            "@": function(stream) {
                stream.eatWhile(/[\w\$]/);
                return "keyword";
            },
            "#": cppHook,
            "u": cpp11StringHook,
            "U": cpp11StringHook,
            "L": cpp11StringHook,
            "R": cpp11StringHook
        },
        modeProps: {fold: ["brace", "include"]}
    });

    function extractKeywords(keywordsFile){
        var $deferred = $.Deferred();
        var rows = [];
        FileUtils.readAsText(keywordsFile)
            .done(function (text) {
                var list = [];
                rows = text.split("\n"); //put text into an array row by row
                rows = _.filter(rows, function (elem) {
                    return !(
                    (elem[0] === "#") ||    //removes comments rows
                    (elem.length === 0)     //removes empty rows
                    );
                });
                for (var i = 0; i < rows.length; i++) {        //cleans rows by 'KEYWORDS' strings
                    if (rows[i].indexOf('\t') >= 0) {
                        rows[i] = rows[i].substring(0, rows[i].indexOf('\t'));
                        list.push(rows[i]);
                        //list += " " + rows[i];
                    }
                }

                list = $.unique(list);
                $deferred.resolve(list);

            }).
            fail(function(error){
                $deferred.reject([]);
            });

        return $deferred.promise();
    }

    /*****************************************************************************************************************/

    function ArduinoHints() {
        this.activeToken = "";
        this.lastToken = "";
        this.cachedKeywords = [];
    }
    ArduinoHints.prototype.hasHints = function (editor , implicitChar) {
        this.editor = editor;

            //libraryKeys = [];
            libraryPaths = [];

        var i = 0,
            cursor = editor.getCursorPos(),
            tokenToCursor = "";

        if (_arduinoLibPath || _usrLibPath) {
            var rawWordList = editor.document.getText().split("\n");
            //libraryPaths = [];
            for (i in rawWordList) {
                var temp = rawWordList[i].substring(rawWordList[i].lastIndexOf("#include"), rawWordList[i].lastIndexOf(">")+1);
                temp = temp.substring(temp.lastIndexOf("<")+1, temp.lastIndexOf("."));
                if (temp) {
                    if (temp == 'LiquidCrystal_I2C') {
                        temp = 'LiquidCrystal';
                    }
                    //libraryPaths.push(temp);
                    libraryPaths.push(_arduinoLibPath + temp);
                    libraryPaths.push(_usrLibPath + temp);
                }
            }
            libraryPaths = $.unique(libraryPaths);
            //libraryKeys = [];
            for (i in libraryPaths) {
                var libpath = libraryPaths[i];

                //var L = FileSystem.getFileForPath(libpath);
                var K = FileSystem.getFileForPath(libpath + "/keywords.txt");

                //Extracts keywords from keywords.txt files
                extractKeywords(K).
                    done(function(keywords){
                        libraryKeys = $.unique(libraryKeys.concat(keywords));
                    });
            }
        }

        this.activeToken = TokenUtils.getInitialContext(editor._codeMirror, cursor);
        tokenToCursor = getTokenToCursor(this.activeToken);
        var step = 1;
        if(this.activeToken.token.string.length > 1 || implicitChar=== null) {
            for (i = 0; i < this.cachedKeywords.length; ++i) {
                if (this.cachedKeywords[i].toUpperCase().indexOf(tokenToCursor.toUpperCase()) === 0) {
                    return true;
                }
            }
            for (i = 0; i < libraryKeys.length; ++i) {
                if (libraryKeys[i].toUpperCase().indexOf(tokenToCursor.toUpperCase()) === 0) {
                    return true;
                }
            }
        }
        return false;


        /* BEFORE */
        //if(this.activeToken.token.string.length > 1 || implicitChar=== null)
        //    for(i = 0; i < this.cachedKeywords.length; ++i)
        //        if(this.cachedKeywords[i].toUpperCase().indexOf(tokenToCursor.toUpperCase()) === 0)
        //            return true;
        //return false;
    };
    ArduinoHints.prototype.getHints = function(implicitChar) {
        var i = 0,
            hintlist = [],
            keywordlist = [],
            $fhint,
            cursor = this.editor.getCursorPos(),
            tokenToCursor = "";

        this.activeToken = TokenUtils.getInitialContext(this.editor._codeMirror,cursor);
        tokenToCursor = getTokenToCursor(this.activeToken);

        for(i = 0; i < this.cachedKeywords.length; ++i){
            if(this.cachedKeywords[i].toUpperCase().indexOf(tokenToCursor.toUpperCase()) === 0) {
                $fhint = $("<span>").text(this.cachedKeywords[i]);
                hintlist.push($fhint);
                var poo = ($fhint[0]);
            }
        }

        libraryKeys = $.unique(libraryKeys);
        for(i = 0; i < libraryKeys.length; ++i){
            if(libraryKeys[i].toLowerCase().indexOf(tokenToCursor.toLowerCase()) === 0) {
                $fhint = $("<span>").text(libraryKeys[i]);
                hintlist.push($fhint);
                var poo = ($fhint[0]);
            }
        }
        libraryKeys = [];
        hintlist.sort(function(a,b){return (($(a[0]))[0].outerText.length - ($(b[0]))[0].outerText.length);});
        return {
            hints: hintlist,
            match: false,
            selectInitial: true,
            handleWideResults: false
        };
    };
    ArduinoHints.prototype.insertHint = function($hint) {
        var cursor = this.editor.getCursorPos(),
            currentToken        = this.editor._codeMirror.getTokenAt(cursor),
            replaceStart        = {line: cursor.line, ch: currentToken.start},
            replaceEnd          = {line: cursor.line, ch: cursor.ch};
        var code = $hint.text();

        if(code in keywords) {
            code = code.substring(0, code.lastIndexOf("|")-1);
            if(!(code in libraryKeys)){
                libraryKeys.push(code);
            }
            isKeyword = true;
        }
        libraryKeys = [];
        this.editor.document.replaceRange(code, replaceStart, replaceEnd);
        return false;
    };

    function getTokenToCursor(token) {
        var tokenStart = token.token.start,
            tokenCursor = token.pos.ch,
            tokenString = token.token.string;
        return tokenString.substr(0, (tokenCursor - tokenStart));
    }

    AppInit.appReady(function () {
        var ardHints = new ArduinoHints();

        CodeHintManager.registerHintProvider(ardHints,["arduino"],10);
        ardHints.cachedKeywords = hintwords;
    });

    //CodeMirror.registerHelper("ardHintWords", "text/x-ino", hintwords);
    // TODO: need CodeMirror.registerHelper("hintWords", ...) call ?
    
});
