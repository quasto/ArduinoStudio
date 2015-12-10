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
 *  Created by:
 *  - sergio@arduino.org 10 Dec 2015
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var NodeDomain          = require("utils/NodeDomain"),
        FileUtils           = require("file/FileUtils"),
        FileSystem          = require("filesystem/FileSystem"),
        PreferencesManager  = require("preferences/PreferencesManager");

    var domainPath = FileUtils.getNativeBracketsDirectoryPath() + "/" + FileUtils.getNativeModuleDirectoryPath(module) + "/node/OsDomain";
    var osDomain = new NodeDomain("arduino-os-domain", domainPath);

    var _prefsPrefix = "arduino.pref";
    /**
     * @type {PrefixedPreferencesSystem} _prefs
     * @private
     */
    var _prefs = PreferencesManager.getExtensionPrefs(_prefsPrefix);

    /** @type {ConsoleView} The console view. Initialized in htmlReady() */
    var _consoleView = null;

    /**
     * Gets the User Home directory absolute path
     * return {FileSystemEntry} resolve the user home directory or reject with the error string
     */
    var getUserHomeDir = function(){
        var $deferred = $.Deferred();
        osDomain.exec("getUserHome")
            .done( function(path){
                $deferred.resolve(FileSystem.getDirectoryForPath(path));
            })
            .fail(function(error) {
                $deferred.reject(error);
            });
        return $deferred.promise();
    };

    /**
     * Gets the User Documents directory absolute path
     * @param {FileSystemEntry} resolve the user documents directory or reject with the error string
     */
    var getUserDocumentsDir = function(){
        var $deferred = $.Deferred();
        osDomain.exec("getUserDocuments")
            .done( function(path){
                $deferred.resolve(FileSystem.getDirectoryForPath(path));
            })
            .fail(function(error) {
                $deferred.reject(error);
            });
        return $deferred.promise();
    };


    /**
     * Gets the Arduino User Libraries directory absolute path
     * @param {FileSystemEntry} resolve the Arduino User Libraries directory or reject with the error string
     */
    var getUserArduinoLibrariesDir = function(){
        var $deferred = $.Deferred();
        osDomain.exec("getUserArduinoHomeLibraries", _prefs.get("home") || "")
            .done( function(path){
                $deferred.resolve(FileSystem.getDirectoryForPath(path));
            })
            .fail(function(error) {
                $deferred.reject(error);
            });
        return $deferred.promise();
    };

    /**
     * Gets the Arduino Home directory absolute path
     * @param {FileSystemEntry} resolve the Arduino Home directory or reject with the error string
     */
    var getArduinoHomeDir = function(){
        var $deferred = $.Deferred();
        osDomain.exec("getUserArduinoHome", _prefs.get("home") || "")
            .done( function(path){
                $deferred.resolve(FileSystem.getDirectoryForPath(path));
            })
            .fail(function(error) {
                $deferred.reject(error);
            });
        return $deferred.promise();
    };


    /**
     * Gets the Arduino Default Libraries directory absolute path
     * @param {FileSystemEntry} resolve the Arduino Default Libraries directory or reject with the error string
     */
    var getArduinoHomeLibrariesDir = function(){
        var $deferred = $.Deferred();
        var bracketsDirPath = FileUtils.getNativeBracketsDirectoryPath(),
            libsPathStr = bracketsDirPath.substr(0, bracketsDirPath.lastIndexOf("/")) + "/libraries";

        $deferred.resolve(FileSystem.getDirectoryForPath(libsPathStr));

        return $deferred.promise();
    };

    // Define public API
    exports.getUserHomeDir = getUserHomeDir;
    exports.getUserDocumentsDir = getUserDocumentsDir;
    exports.getUserArduinoLibrariesDir = getUserArduinoLibrariesDir;
    exports.getArduinoHomeDir = getArduinoHomeDir;
    exports.getArduinoHomeLibrariesDir = getArduinoHomeLibrariesDir;

});