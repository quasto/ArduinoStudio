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
 * Copyright 2015 Arduino Srl (http://www.arduino.org/)
 *
 *  Created by:
 *  - sergio@arduino.org 09 Dec 2015
 *  - sebba@arduino.org 09 Dec 2015
 *
 */

(function () {
    "use strict";
    var fs = require('fs');

    var domainName = "arduino-os-domain",
        dManager;

    var _defaultArduinoHome = getUserDocuments() + "/Arduino";

    /**
     * Get the User Home absolute path
     *
     * @returns {String}
     */
    function getUserHome() {
        return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    }

    /**
     * Get the User Documents absolute path
     *
     * @returns {String}
     */
    function getUserDocuments() {
        return getUserHome()+"/Documents";
    }

    /**
     * Get the Arduino Home absolute path
     *
     * @returns {String}
     */
    function getUserArduinoHome(prefUserArduinoHome, callback) {
        fs.exists( prefUserArduinoHome, function(exists) { //if exists the user home stored in pref file callback it
            if(exists)
                callback(null, prefUserArduinoHome);
            else{   //else try the default arduino dir under Documents, but if not exists create it
                //var arduino_home =  getUserHome()+((process.platform =='win32') ? '\\Documents\\Arduino-2' : "/Documents/Arduino-2");
                fs.exists( _defaultArduinoHome, function(exists) {
                    if(!exists )
                        fs.mkdir(_defaultArduinoHome, function(err){
                            if(!err)
                                callback(null, _defaultArduinoHome);
                            else
                                callback(err);

                        });
                    else
                        callback(null, _defaultArduinoHome );

                });
            }
        });
    }

    /**
     * Get the Arduino User Libraries absolute path
     *
     * @returns {String}
     */
    function getUserArduinoHomeLibraries(prefUserArduinoHome, callback) {
        getUserArduinoHome(prefUserArduinoHome, function(err, user_home_arduino){
            if(!err){
                var user_home_arduino_libraries = user_home_arduino + "/libraries";
                fs.exists( user_home_arduino_libraries, function(exists) {
                    if(!exists )
                        fs.mkdir(user_home_arduino_libraries, function(err){
                            if(!err)
                                callback(null, user_home_arduino_libraries);
                            else
                                callback(err);
                        });
                    else
                        callback(null, user_home_arduino_libraries );
                });
            }
            else{
                callback(err);
            }
        });
    }

    function init(domainManager){
        if(!domainManager.hasDomain( domainName )){
            domainManager.registerDomain( domainName, {major: 0, minor: 1});
        }
        dManager = domainManager;

        dManager.registerCommand(
            domainName,
            "getUserHome",
            getUserHome,
            false,
            "get the user home path"
        );

        dManager.registerCommand(
            domainName,
            "getUserDocuments",
            getUserDocuments,
            false,
            "get the user documents path"
        );

        dManager.registerCommand(
            domainName,
            "getUserArduinoHome",
            getUserArduinoHome,
            true,
            "get the user arduino path"
        );

        dManager.registerCommand(
            domainName,
            "getUserArduinoHomeLibraries",
            getUserArduinoHomeLibraries,
            true,
            "get the user arduino libraries path"
        );
    }

    exports.init = init;
}());