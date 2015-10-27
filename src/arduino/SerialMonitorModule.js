/*
 * This file is part of Arduino Studio
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Copyright 2015 Arduino Srl (http://www.arduino.org/) support@arduino.org
 *
 * authors:     sergio@arduino.org
 * create:      14 Oct 2015 sergio@arduino.org
 * edit:        21 Oct 2015 sergio@arduino.org | back to the future day!
 *
 */


/*global define, $, Mustache */

/*
 * Panel showing the log Console for Compile/Upload operations. more in general for log messages.
 */
define(function (require, exports, module) {
    "use strict";

    var WorkspaceManager      = require("view/WorkspaceManager"),
        //ExtensionUtils        = require("utils/ExtensionUtils"),
        SerialMonitor         = require("arduino/SerialMonitor"),
        Strings               = require("strings"),

        _serialMonitorPanelTemplate  = require("text!htmlContent/serialmonitor-panel.html");
        //_serialMonitorPanelCss       = require("text!./SerialMonitor.css");

    var _panelHtml, _panel, _$panel, _$logger, _row = 0, _maxRow = 100;

    function init(panelName) {
        //ExtensionUtils.addEmbeddedStyleSheet(_serialMonitorPanelCss);
        _panelHtml  = Mustache.render(_serialMonitorPanelTemplate, Strings);
        _panel      = WorkspaceManager.createBottomPanel(panelName, $(_panelHtml));
        _$panel     = _panel.$panel;
        _$logger    = _$panel.find("#console_log");

        _maxRow = SerialMonitor.getMaxRow();

        // DOM Values
        _$panel.find("#baud").val( SerialMonitor.getBaudRate() );
        _$panel.find("#eol").val( SerialMonitor.getEol() );
        _$panel.find("#scroll")[0].checked = SerialMonitor.getAutoscroll();

        // DOM Events
        _$panel.find("#clear_button").on("click", function () {
            clear();
        });

        _$panel.find("#send_button").on("click",function(){
            var message = _$panel.find("#message_input")[0].value;
            SerialMonitor.sendMessage(message);
            _$panel.find("#message_input").val("");
        });

        _$panel.find("#message_input").keypress(function(e) {
            if(e.keyCode === 13 || e.keyCode === 10) {
                var message = _$panel.find("#message_input")[0].value;
                SerialMonitor.sendMessage(message);
                _$panel.find("#message_input").val("");
            }
        });

        _$panel.find("#eol").on("change",function(){
            var select_item = _$panel.find("#eol")[0],
                eol = select_item.selectedOptions[0].value;
            SerialMonitor.setEol(eol);
        });

        _$panel.find("#baud").on("change",function(){
            var select_item = _$panel.find("#baud")[0],
                rate = parseInt(select_item.selectedOptions[0].value, 10);
            SerialMonitor.setBaudRate(rate);
        });

        _$panel.find("#scroll").on("click",function(){
            var autoscroll = _$panel.find("#scroll")[0].checked;
            SerialMonitor.setAutoscroll(autoscroll);
        });

        // Serial Monitor Events
        SerialMonitor.on("start-monitoring",function(){
            _$panel.find("#test").html("OK");
        });

        SerialMonitor.on("stop-monitoring",function(){
            _$panel.find("#test").html("KO");
        });
    }

    /**
     * Dispose the Serial Monitor panel.
     */
    function dispose() {
        if(_panel){
            _$panel.remove();
        }
    }

    /**
     * Shows the Serial Monitor panel.
     */
    function show() {
        if(_panel && !_panel.isVisible()){
            _panel.show();
        }
    }

    /**
     * Hides the Serial Monitor Panel.
     */
    function hide() {
        if (_panel && _panel.isVisible()) {
            _panel.hide();
        }
    }

    /**
     * Says if the Serial Monitor Panel is visible.
     * @return {boolean}
     */
    function isVisible() {
        if (_panel && _panel.isVisible()) {
            return true;
        }
        else{
            return false;
        }
    }

    /**
     * Changes status visible/not-visible of the Serial Monitor Panel.
     */
    function toggle() {
        if (_panel && _panel.isVisible()) {
            hide();
        }
        else{
            show();
        }
    }

    /**
     * Clears the Serial Monitor log.
     */
    function clear() {
        if (_panel && _$logger) {
            _$logger.empty();
            _row = 0;
        }
    }

    /**
     * Logs to the Serial Monitor log area.
     */
    function log(message) {
        if (_panel && _$logger && message !== undefined) {
            //message = message.replace(/(\r\n|\n|\r)/gm,"</br>");
            message = "<p>" + message.replace(/(\r\n|\n|\r)/gm,"") + "</p>";

            //switch(serialPortEol) {
            //    case "NL":      message += "\n";    break;
            //    case "CR":      message += "\r";    break;
            //    case "NLCR":    message += "\r\n";  break;
            //    case "NA":      message += "";      break;
            //}

            _log(message);
        }
    }

    function _log(message){
        if(_row > _maxRow){
            _row--;
            _$logger.find("p")[0].remove();
        }

        _row++;
        _$logger.append(message);

        if(_$panel.find("#scroll")[0].checked) {
            $('#console_log').scrollTop($('#console_log')[0].scrollHeight);
        }
    }

    // Public API
    module.exports.show = show;
    module.exports.hide = hide;
    module.exports.isVisible = isVisible;
    module.exports.toogle = toggle;
    module.exports.clear = clear;
    module.exports.dispose = dispose;
    module.exports.init = init;
    module.exports.log = log;

});
