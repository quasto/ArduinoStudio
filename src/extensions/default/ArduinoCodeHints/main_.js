
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var AppInit = brackets.getModule("utils/AppInit"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        LanguageManager = brackets.getModule("language/LanguageManager"),
        CodeMirror      = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

    //Load syntax tips from keywords file (json)
    var hintwords = [],
        arduinoKeys = [],
        isKeyword = false,
        libraryKeys = [],
        libraryPaths = [],
        constants = {
            "HIGH": true,
            "LOW": true,
            "INPUT": true,
            "OUTPUT": true,
            "INPUT_PULLUP": true,
            "LED_BUILTIN": true };

    // Get Arduino Words
    var keywords = JSON.parse(require('text!./data/arduinoHints.json'));
    for (var i in keywords) {
        arduinoKeys.push(i.substring(0, i.lastIndexOf("|")-1));
        hintwords.push(i);
    }


/*    ,

    "arduino": {
        "name": "Arduino",
            "mode": ["clike","text/x-csrc"],
            "fileExtensions": ["ino"],
            "blockComment": ["/!*","*!/"],
            "lineComment": ["//","//"]
    }*/



});