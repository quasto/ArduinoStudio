/*
 * This file is part of Arduino
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"]), to deal
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
 * Copyright 2015 Arduino Srl (http://www.arduino.org/)
 *
 * created:            Sep 2015 marcello@arduino.org
 * edited:          15 Oct 2015 sergio@arduino.org
 *
 */
define(function (require, exports, module) {
    "use strict";

    //Arduino Stuffs
    require("arduino/Console");
    require("arduino/SerialMonitor");
    require("arduino/SerialPort");
    require("arduino/Discovery");
    require("text!htmlContent/console-panel.html");
    require("text!htmlContent/serialmonitor-panel.html");

    var AppInit = require("utils/AppInit"),
        CommandManager = require("command/CommandManager"),
        Commands = require("command/Commands"),
        PreferencesManager  = require("preferences/PreferencesManager");


    PreferencesManager.definePreference("arduino.target.board", "string", "uno");
    //TODO default must be undefined, becouse it will be specified by the user at first uploading
    //PreferencesManager.definePreference("arduino.target.port", "string", undefined);
    PreferencesManager.definePreference("arduino.target.port", "string", "/dev/tty.usbmodem1411");
	
    AppInit.appReady(function () {
        $('.toolbar-btn').click(function(evt){
            evt.preventDefault();
            toolbarHandler(this.id);
		});
    });

    /**
     * Handle clicks event on toolbar buttons
     *
     * @param {String} btnId DOM Id of clicked button
     *
     */
	function toolbarHandler(btnId){
        switch(btnId) {
            /*
            case 'toolbar-verify-btn':
                CommandManager.execute(Commands.FILE_SAVE);
                Dispatcher.trigger("arduino-event-console-clear");
                Dispatcher.trigger('arduino-event-build');
                break;
            case 'toolbar-upload-btn':
                CommandManager.execute(Commands.FILE_SAVE);
                Dispatcher.trigger("arduino-event-console-clear");
                Dispatcher.trigger('arduino-event-upload');
                break;
            case 'toolbar-new-btn':
                CommandManager.execute(Commands.FILE_NEW);
                break;
            case 'toolbar-open-btn':
                CommandManager.execute(Commands.FILE_OPEN);
                break;
            case 'toolbar-save-btn':
                CommandManager.execute(Commands.FILE_SAVE);
                break;
             */
        case 'toolbar-serial-btn':
            CommandManager.execute(Commands.TOOGLE_SERIALMONITOR);
            break;
        case 'toolbar-console-btn':
            CommandManager.execute(Commands.TOOLS_CONSOLE_TOOGLE);
            break;
        case 'toolbar-toggle-btn':
            if($('#sidebar').is(':visible')){
                $('#sidebar').hide();
                $('.main-view .content').css('right', '0px');
            }
            else{
                $('.main-view .content').css('right', '200px');
                $('#sidebar').show();
            }
            break;
        default:
            //console.log(btnId+' clicked');
        }
    }
});