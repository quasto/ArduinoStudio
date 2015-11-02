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
 * date:        04 Sep 2015
 * edit:        21 Oct 2015 sergio@arduino.org | back to the future day!
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var AppInit             = require("utils/AppInit"),
        EventDispatcher     = require("utils/EventDispatcher"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        Commands            = require("command/Commands"),
        CommandManager      = require("command/CommandManager"),
        Strings             = require("strings"),
        FileUtils           = require("file/FileUtils"),
        ModuleManager       = require("arduino/ModuleManager"),
        Console             = require("arduino/Console"),
        SerialPort          = require("arduino/SerialPort").SerialPort;

    var _prefsPrefix = "arduino.panel.serialmonitor";

    /**
     * @type {string} _serialMonitorDefaultModule is the path of the default Serial Monitor Module
     * @private
     */
    var _serialMonitorDefaultModule = FileUtils.getNativeBracketsDirectoryPath() + "/" + FileUtils.getNativeModuleDirectoryPath(module) + "/SerialMonitorModule.js";

    /**
     * @type {PrefixedPreferencesSystem} _prefs
     * @private
     */
    var _prefs = PreferencesManager.getExtensionPrefs("arduino.panel.serialmonitor");

    /** @type {SerialMonitorModule} The Serial Monitor Module. Initialized in htmlReady() */
    var _serialMonitorModule = null;

    /** @type {boolean} _isMonitoring - true if serial monitor is active, false if not*/
    //var _isMonitoring = false;

    /** @type {SerialPort} _port - is the SerialPort Object used in the Serial Monitor for read and write value to the board*/
    var _port = null;

    var _timer = null;
    /**
     *
     * @type {Object} contains value for the End Of Line chars.
     */
    var EOL = {
        NL:     "\n",
        CR:     "\r",
        BOTH:   "\r\n",
        NA:     ""
    };

    PreferencesManager.definePreference(_prefsPrefix + ".show", "boolean", true);
    PreferencesManager.definePreference(_prefsPrefix + ".module.default", "string", _serialMonitorDefaultModule);

    PreferencesManager.definePreference(_prefsPrefix + ".baudrate", "number", 9600);
    PreferencesManager.definePreference(_prefsPrefix + ".eol", "String", "NL");
    PreferencesManager.definePreference(_prefsPrefix + ".autoscroll", "boolean", true);
    PreferencesManager.definePreference(_prefsPrefix + ".autostart", "boolean", true);         //automatically connect to serial port when serial monitor panel is shown
    PreferencesManager.definePreference(_prefsPrefix + ".autostop", "boolean", true);          //automatically stop connection to serial port when serial monitor is hidden
    PreferencesManager.definePreference(_prefsPrefix + ".autoreconnect", "boolean", true);     //if the usb is unplugged, the serial monitor automatically reconnect to the serial port.
    PreferencesManager.definePreference(_prefsPrefix + ".maxrow", "number", 20);      //if the usb is unplugged, the serial monitor automatically reconnect to the serial port.

    EventDispatcher.makeEventDispatcher(exports);

    /**
     * Hides the Serial Monitor
     */
    function hide() {
        _serialMonitorModule.hide();
        _prefs.set("show", false);
        if(_prefs.set("autostop", true)){
            stopMonitor();
        }
        exports.trigger("hide");
    }

    /**
     * Shows the Serial Monitor
     */
    function show() {
        _serialMonitorModule.show();
        clear();
        _prefs.set("show", true);
        if(_prefs.set("autostart", true)){
            //startMonitor();
            _reconnect();
        }
        exports.trigger("show");
    }

    /**
     * Says if the Serial Monitor is visible
     */
    function isVisible() {
        return _serialMonitorModule.isVisible();
    }

    /**
     * Shows if Serial Monitor is invisible or hides if visible
     */
    function toggle() {
        if(isVisible()){
            hide();
        }
        else{
            show();
        }
        exports.trigger("toggle");
    }

    /**
     * Clears the Serial Monitor Log
     */
    function clear() {
        _serialMonitorModule.clear();
        exports.trigger("clear");
    }

    /**
     * Says if the Serial Monitor is active
     */
    /*function isMonitoring() {
        if(!!_port && _port.isOpen()){
            return true;
        }
        else{
            return false;
        }

        //return _isMonitoring;
    }*/

    /**
     * Stops monitoring the serial port
     */
    function stopMonitor() {
        var $deferred = $.Deferred();
        if(!!_port){
            _port.isOpen()
                .done(function(status){
                    if(!status){
                        //var error = "Serial Monitor already inactive.";
                        //Console.logError("{"+ module.id +"} - " + error);
                        exports.trigger("stop-monitoring");
                        $deferred.resolve(!status);
                    }
                    else{
                        _port.close()
                            .done(function(status){
                                //exports.off("data");
                                exports.trigger("stop-monitoring");
                                //_isMonitoring = false;
                                $deferred.resolve(status);
                            })
                            .fail(function(error){
                                //Console.logError("{"+ module.id +"} - " + error);
                                $deferred.reject(error);
                            });
                    }
                });
        }
        else{
            exports.trigger("stop-monitoring");
            $deferred.resolve(true);
        }
        return $deferred.promise();

/*        var $deferred = $.Deferred();
        if( !_isMonitoring ){
            //TODO i18n this String
            var error = "Serial Monitor already inactive.";
            Console.logError("{"+ module.id +"} - " + error);
            $deferred.reject(error);
        }
        else{
            if(!!_port){
                _port.close()
                    .done(function(status){
                        //exports.off("data");
                        exports.trigger("stop-monitoring");
                        _isMonitoring = false;
                        $deferred.resolve(status);
                    })
                    .fail(function(error){
                        Console.logError("{"+ module.id +"} - " + error);
                        $deferred.reject(error);
                    });
            }
        }
        return $deferred.promise();*/
    }

    function _openConnection(){
        var $deferred = $.Deferred();
        var portAddress = PreferencesManager.get("arduino.target.port");
        var baudRate = _prefs.get("baudrate");
        if(!!portAddress) {
            _port = new SerialPort(portAddress, baudRate);
            _port.open()
                .done(function (status) {
                    //_isMonitoring = true;
                    clear();
                    _port.on("data", function ($evt, result) {
                        _handleSerialData(result);
                    });
                    _port.on("close", function () {
                        _handleSerialClosing();
                    });
                    _port.on("error", function (error) {
                        _handleSerialError(error);
                    });
                    $deferred.resolve(status);
                })
                .fail(function (error) {
                    Console.logError("{" + module.id + "} - " + error);
                    $deferred.reject(error);
                });
        }
        else{
            //TODO i18n this String
            var error = "Specify serial port address.";
            //Console.logError("{"+ module.id +"} - " + error);
            $deferred.reject(error);
        }
        return $deferred.promise();
    }

    function _reconnect(){

        startMonitor().fail(function(error){
            _timer = window.setInterval(function () {
                if( !!_prefs.get("show") && !!_prefs.get("autostart") ) {
                    startMonitor();
                }
            }, 5000);
        });
    }

    /**
     * Starts monitoring the serial port
     */
    function startMonitor() {
        var $deferred = $.Deferred();
        if(!_port){
            _openConnection()
                .done(function(status){
                    exports.trigger("start-monitoring");
                    window.clearInterval(_timer);
                    $deferred.resolve(status);
                })
                .fail(function(error){
                    $deferred.reject(error);
                });
        }
        else{
            _port.isOpen()
                .done(function(status){
                    if( status ){
                        var error = "Serial Monitor already active.";
                        //Console.logError("{"+ module.id +"} - " + error);
                        $deferred.reject(error);
                    }
                    else{
                        _openConnection()
                            .done(function(status){
                                exports.trigger("start-monitoring");
                                window.clearInterval(_timer);
                                $deferred.resolve(status);
                            })
                            .fail(function(error){
                                $deferred.reject(error);
                            });
                    }
                })
                .fail(function(error){
                    $deferred.reject(error);
                });
        }

        return $deferred.promise();

/*        var $deferred = $.Deferred();

        if( !!_isMonitoring ){
            //TODO i18n this String
            var error = "Serial Monitor already active.";
            Console.logError("{"+ module.id +"} - " + error);
            $deferred.reject(error);
        }
        else {
            var portAddress = PreferencesManager.get("arduino.target.port");
            var baudRate = _prefs.get("baudrate");

            if(!!portAddress) {
                _port = new SerialPort(portAddress, baudRate);
                _port.open()
                    .done(function (status) {
                        _isMonitoring = true;
                        exports.trigger("start-monitoring");
                        clear();
                        _port.on("data", function ($evt, result) {
                            _handleSerialData(result);
                        });
                        _port.on("close", function(){
                            _handleSerialClosing();
                        });
                        _port.on("close", function(error){
                            _handleSerialError(error);
                        });
                        $deferred.resolve(status);
                    })
                    .fail(function (error) {
                        Console.logError("{"+ module.id +"} - " + error);
                        $deferred.reject(error);
                    });
            }
            else{
                //TODO i18n this String
                var error = "Specify serial port address.";
                Console.logError("{"+ module.id +"} - " + error);
                $deferred.reject(error);
            }
        }
        return $deferred.promise();*/
    }

    /**
     * Sends message through the Serial Port
     * @param message
     */
    function sendMessage(message){
        if(!!_port){
            _port.isOpen()
                .done(function(status){
                    if(status){
                        message += EOL[_prefs.get("eol")];
                        _port.write(message);
                    }
                });
        }



/*        if(/!*!!_isMonitoring && *!/!!_port && !!message && _port.isOpen()){
            message += EOL[_prefs.get("eol")];
            _port.write(message);
        }*/
    }

    /**
     * Sets the baud rate value into preferences
     * @param rate {Integer} Integer value for the baud rate in the serial connection
     */
    function setBaudRate(rate){
        var currRate = _prefs.get("baudrate");
        if(!!rate && !!currRate && currRate !== rate){
            _prefs.set("baudrate", rate);
            if( /*!!_isMonitoring*/ !!_port){
                _port.isOpen()
                    .done(function(status){
                        if(status){
                            stopMonitor()
                                .done(function(result){
                                    startMonitor();
                                });
                        }
                    });
            }
        }
    }

    /**
     * Gets the current baud rate value from preferences
     */
    function getBaudRate(){
        return _prefs.get("baudrate");
    }

    /**
     * Sets the end of line identifier value into preferences
     * @param eol {string} eg. NA: Not Available, CR: Carriage Return, NL: New Line, BOTH:  New Line and Carriage Return
     */
    function setEol(eol){
        if(!!eol) {
            eol = eol.toUpperCase();
            if (!!EOL[eol]) {
                _prefs.set("eol", eol);
            }
        }
    }

    /**
     * Gets the current end of line identifier value from preferences
     */
    function getEol(){
        return _prefs.get("eol");
    }

    /**
     * Sets the max number of row to print, into preferences
     * @param status {boolean} true if you want to enable the autoscroll, otherwise false
     */
    function setMaxRow(rows){
        if(!!rows) {
            _prefs.set("maxrow", rows);
        }

    }

    /**
     * Gets the current max number of row to print into the logger, from preferences
     */
    function getMaxRow(){
        return _prefs.get("maxrow");
    }

    /**
     * Sets the autoscrollo-enabling value into preferences
     * @param status {boolean} true if you want to enable the autoscroll, otherwise false
     */
    function setAutoscroll(status){
        if(status !== 'undefined') {
            _prefs.set("autoscroll", status);
        }
        else {
            _prefs.set("autoscroll", true);
        }

    }

    /**
     * Gets the current autoscrollo-enabling value from preferences
     */
    function getAutoscroll(){
        return _prefs.get("autoscroll");
    }

    /**
     * Logs message to the Serial Monitor log panel
     * @param message
     * @private
     */
    function _handleSerialData(message){
        exports.trigger("data", message);
        _serialMonitorModule.log(message);
    }

    /**
     * Handles errors of serial connection
     * @param error
     * @private
     */
    function _handleSerialError(error){
        exports.trigger("error", error);
        Console.logError("{"+ module.id +"} - " + error);
    }

    /**
     * Handles the closing of the serial connection
     * @private
     */
    function _handleSerialClosing(){
        exports.trigger("close");
        //_isMonitoring = false;
        stopMonitor();
        _reconnect();
        //TODO i18n this String
        Console.logError("{"+ module.id +"} - Serial Port closed.");
    }

    AppInit.htmlReady(function () {
        ModuleManager.loadModule(_prefsPrefix, "default")
            .done(function(module){
                _serialMonitorModule = module;
                if( !!_prefs.get("show") ) {
                    show();
                }
                else {
                    hide();
                }
            });
    });

    CommandManager.register(Strings.CMD_SERIALMONITOR, Commands.TOOGLE_SERIALMONITOR, toggle);
    CommandManager.register(Strings.CMD_SERIALMONITOR_START, Commands.CMD_SERIALMONITOR_START, startMonitor);
    CommandManager.register(Strings.CMD_SERIALMONITOR_STOP, Commands.CMD_SERIALMONITOR_STOP, stopMonitor);

    // Define public API
    exports.show = show;
    exports.hide = hide;
    exports.isVisible = isVisible;
    exports.toggle = toggle;
    exports.clear = clear;
    exports.sendMessage = sendMessage;

    exports.setBaudRate = setBaudRate;
    exports.setEol = setEol;
    exports.setAutoscroll = setAutoscroll;
    exports.setMaxRow = setMaxRow;

    exports.getBaudRate = getBaudRate;
    exports.getEol = getEol;
    exports.getAutoscroll = getAutoscroll;
    exports.getMaxRow = getMaxRow;

    exports.startMonitor = startMonitor;
    exports.stopMonitor = stopMonitor;
    //exports.isMonitoring = isMonitoring;
    exports.EOL = EOL;
});
