/**
 *  BASED ON https://github.com/zanven42/brackets-sqf
 *  BY Anthony "Zanven" Poschen
 *  UNDER MIT LICENSE
 *
 *  MODIFIED BY Arduino.org Team - 05/2015
 */

define(function (require, exports, module) {
    'use strict';
    var ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        InlineWidget        = brackets.getModule("editor/InlineWidget").InlineWidget,
        KeyEvent            = brackets.getModule("utils/KeyEvent"),
        NativeApp           = brackets.getModule("utils/NativeApp"),
        Strings             = brackets.getModule("strings"),
        ArduinoStrings             = require("./strings");
    
    var inlineEditorTemplate = require("text!./html/InlineDocsViewer.html");
    var SCROLL_LINE_HEIGHT = 40;
    
    ExtensionUtils.loadStyleSheet(module, "./css/WebPlatformDocs.less");
    
    function InlineDocsViewer(PropName, language, PropDetails) {
        InlineWidget.call(this);
        var bottom_style = '', syntax_style = '', return_style = ''; 
        var templateVars = {
            propName      : PropName,
            summary       : PropDetails.SUMMARY,
            syntax        : PropDetails.SYNTAX.Syntax,
            return        : PropDetails.SYNTAX.Return,
            Params        : PropDetails.SYNTAX.Params,
            Examples      : PropDetails.EXAMPLES,
            Additional    : PropDetails.ADDITIONAL,
            url           : PropDetails.URL,
            baseurl       : PropDetails.BASEURL,
            BottomStyle   : bottom_style,
            SyntaxStyle   : syntax_style,
            ReturnStyle   : return_style,
            Strings       : Strings,
            ArduinoStrings: ArduinoStrings
        };
        
        var html = Mustache.render(inlineEditorTemplate, templateVars);
        
        this.$wrapperDiv = $(html);
        this.$htmlContent.append(this.$wrapperDiv);
        this.$wrapperDiv.find("a").each(function (index, elem) {
            var $elem = $(elem);
            var url = $elem.attr("href");
            if (url && url.substr(0, 4) !== "http") {
                // URLs in JSON data are relative
                url = "http://de2.php.net/manual/"+language+"/"+ url+".php";
                $elem.attr("href", url);
            }
            $elem.attr("title", url);
        });
        
        this._sizeEditorToContent   = this._sizeEditorToContent.bind(this);
        this._handleWheelScroll     = this._handleWheelScroll.bind(this);

        this.$scroller = this.$wrapperDiv.find(".scroller");
        this.$scroller.on("mousewheel", this._handleWheelScroll);
        this._onKeydown = this._onKeydown.bind(this);
    }
    
    InlineDocsViewer.prototype = Object.create(InlineWidget.prototype);
    InlineDocsViewer.prototype.constructor = InlineDocsViewer;
    InlineDocsViewer.prototype.parentClass = InlineWidget.prototype;
    
    InlineDocsViewer.prototype.$wrapperDiv = null;
    InlineDocsViewer.prototype.$scroller = null;
    
    InlineDocsViewer.prototype._handleScrolling = function (event, scrollingUp, scroller) {
        event.stopPropagation();
        if (scrollingUp && scroller.scrollTop === 0) {
            event.preventDefault();
            return true;
        } else if (!scrollingUp && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight) {
            event.preventDefault();
            return true;
        }
        
        return false;
    };
    
    InlineDocsViewer.prototype._handleWheelScroll = function (event) {
        var scrollingUp = (event.originalEvent.wheelDeltaY > 0),
            scroller = event.currentTarget;
        
        if (scroller.clientHeight >= scroller.scrollHeight) {
            return;
        }
        
        this._handleScrolling(event, scrollingUp, scroller);
    };
    
    InlineDocsViewer.prototype._onKeydown = function (event) {
        var keyCode  = event.keyCode,
            scroller = this.$scroller[0],
            scrollPos;

        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return false;
        }

        scrollPos = scroller.scrollTop;

        switch (keyCode) {
        case KeyEvent.DOM_VK_UP:
            scrollPos = Math.max(0, scrollPos - SCROLL_LINE_HEIGHT);
            break;
        case KeyEvent.DOM_VK_PAGE_UP:
            scrollPos = Math.max(0, scrollPos - scroller.clientHeight);
            break;
        case KeyEvent.DOM_VK_DOWN:
            scrollPos = Math.min(scroller.scrollHeight - scroller.clientHeight,
                                 scrollPos + SCROLL_LINE_HEIGHT);
            break;
        case KeyEvent.DOM_VK_PAGE_DOWN:
            scrollPos = Math.min(scroller.scrollHeight - scroller.clientHeight,
                                 scrollPos + scroller.clientHeight);
            break;
        default:
            return false;
        }
        scroller.scrollTop = scrollPos;
        event.stopPropagation();
        event.preventDefault();
        return true;
    };
    
    InlineDocsViewer.prototype.onAdded = function () {
        InlineDocsViewer.prototype.parentClass.onAdded.apply(this, arguments);
        this._sizeEditorToContent();
        $(window).on("resize", this._sizeEditorToContent);
        this.$scroller[0].focus();
        this.$wrapperDiv[0].addEventListener("keydown", this._onKeydown, true);
    };
	
    InlineDocsViewer.prototype.onClosed = function () {
        InlineDocsViewer.prototype.parentClass.onClosed.apply(this, arguments);
        $(window).off("resize", this._sizeEditorToContent);
        this.$wrapperDiv[0].removeEventListener("keydown", this._onKeydown, true);
    };
    
    InlineDocsViewer.prototype._sizeEditorToContent = function () {
        this.hostEditor.setInlineWidgetHeight(this, this.$wrapperDiv.height() + 20, true);
    };

    module.exports = InlineDocsViewer;
});
