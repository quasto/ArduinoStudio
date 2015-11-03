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
 * created:             04 Sep 2015 sergio@arduino.org
 * edited:              14 Oct 2015 sergio@arduino.org
 */


/**
 * questo modulo é una sorta di interfaccia per le api core della console, utilizzabile nei moduli di AS o nelle estensioni utente da un lato,
 * mentre dall'altro e la
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
        ModuleManager       = require("arduino/ModuleManager");


    // make sure the global brackets variable is loaded
    // require("utils/Global");

    var _prefsPrefix = "arduino.panel.console";

    /**
     * @type {string} _consoleDefaultModule is the path of the default Console Module
     * @private
     */
    var _consoleDefaultModule = FileUtils.getNativeBracketsDirectoryPath() + "/" + FileUtils.getNativeModuleDirectoryPath(module) + "/ConsoleModule.js";

    /**
     *
     * @type {Object} LOG_TYPE Contains key/value informations to determinate the logging type.
     */
    var LOG_TYPE = {
            ERROR:      "logType.Error",
            INFO:       "logType.Info",
            SUCCESS:    "logType.Success",
            WARNING:    "logType.Warning"
        };

    /**
     * @type {PrefixedPreferencesSystem} _prefs
     * @private
     */
    var _prefs = PreferencesManager.getExtensionPrefs(_prefsPrefix);

    /** @type {ConsoleView} The console view. Initialized in htmlReady() */
    var _consoleView = null;

    PreferencesManager.definePreference(_prefsPrefix + ".show", "boolean", true);
    PreferencesManager.definePreference(_prefsPrefix + ".module.default", "string", _consoleDefaultModule);

    PreferencesManager.definePreference(_prefsPrefix + ".maxrow", "number", 500);

    EventDispatcher.makeEventDispatcher(exports);

    /**
     * @constructor
     * logMessage is the object used to rapresents log into the console, it's also triggered trough core api .
     *
     * @param {string} message Message to log.
     * @param {LOG_TYPE} type Log type: info, success, error
     */
    function Message(message, type){
        this.message = message;
        this.type = type || LOG_TYPE.INFO;
        this.timestamp = new Date().toLocaleString();
    }

    /**
     * Hides the Console Panel
     */
    function hide() {
        _consoleView.hide();
        _prefs.set("show", false);
        exports.trigger("hide");
    }

    /**
     * Shows the Console Panel
     */
    function show() {
        _consoleView.show();
        _prefs.set("show", true);
        exports.trigger("show");
    }

    /**
     * Says if the Console Panel is visible
     */
    function isVisible() {
        return _consoleView.isVisible();
    }

    /**
     * Shows if is invisible or hides if visible
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
     * Clears the Console Panel
     */
    function clear() {
        _consoleView.clear();
        exports.trigger("clear");
    }

    /**
     * Log an Info message on the Console Panel
     *
     * @param {Object} data The message to log on the Console.
     */
    function logInfo(data) {
        if(data) {
            var msg = new Message(data, LOG_TYPE.INFO);
            _consoleView.log(msg);
            exports.trigger("log-info", msg);
        }
    }

    /**
     * Log an Error message on the Console Panel
     *
     * @param {Object} data The message to log on the Console.
     */
    function logError(data) {
        if(data) {
            var msg = new Message(data, LOG_TYPE.ERROR);
            _consoleView.log(msg);
            exports.trigger("log-error", msg);

        }
    }

    /**
     * Log a Success/OK message to the Console Panel
     *
     * @param {Object} data The message to log on the Console.
     */
    function logSuccess(data) {
        if(data) {
            var msg = new Message(data, LOG_TYPE.SUCCESS);
            _consoleView.log(msg);
            exports.trigger("log-success", msg);
        }
    }

    /**
     * Log a warning message to the Console Panel
     *
     * @param {Object} data The message to log on the Console.
     */
    function logWarning(data) {
        if(data) {
            var msg = new Message(data, LOG_TYPE.WARNING);
            _consoleView.log(msg);
            exports.trigger("log-warning", msg);
        }
    }

    /**
     * Sets the max number of row to print, into preferences
     * @param status {number} number of rows.
     */
    function setMaxRow(rows){
        if(!!rows) {
            _prefs.set("maxrow", rows);
        }

    }

    /**
     * Gets the current max number of rows to print into the logger, from preferences
     */
    function getMaxRow(){
        return _prefs.get("maxrow");
    }


    AppInit.htmlReady(function () {
        ModuleManager.loadModule(_prefsPrefix, "default")
        .done(function(module){
            _consoleView = module;
            if( !!_prefs.get("show") ) {
                show();
            }
            else {
                hide();
            }
        })
        .fail(function(err){

        });
    });

    CommandManager.register(Strings.CMD_CONSOLE, Commands.TOOGLE_CONSOLE, toggle);

    // Define public API
    exports.show = show;
    exports.hide = hide;
    exports.isVisible = isVisible;
    exports.toggle = toggle;
    exports.clear = clear;
    exports.logInfo = logInfo;
    exports.logError = logError;
    exports.logSuccess = logSuccess;
    exports.logWarning = logWarning;
    exports.setMaxRow = setMaxRow;
    exports.getMaxRow = getMaxRow;
    //exports.loadModule = loadModule;
    //exports.registerModule = registerModule;
    exports.LOG_TYPE = LOG_TYPE;
});
