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
 * created:         14 Oct 2015 sergio@arduino.org
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
define(function (require, exports, module) {
    "use strict";

    var PreferencesManager  = require("preferences/PreferencesManager"),
        FileSystem          = require("filesystem/FileSystem");

    //TODO: implementare un meccanismo che permetta di capire se il modulo rispetta le interfacce.
    //TODO: implementare un meccanismo che permetta la registrazione di altri moduli, che vengono caricati come estensione
    //TODO: quando si fa il load e l'unload del modulo, si dovrebbe prevedere che venga fatto dentro la cornice,

    var _modules = [];

    /**
     * Load a Module and return a promise
     * @param {String} prefix is the string to use in PreferencesManager to get info about the module to load .
     * @param {String} moduleName The module name used to get the module and load it.
     * @returns {JQuery.Promise} the promise resolves if the module is loaded and fails if there's errors
     */
    function loadModule(prefix, moduleName){
        var $deferred = new $.Deferred();
        var moduleFilePath = PreferencesManager.get(prefix + ".module." + moduleName),
            moduleDefaultFilePath = PreferencesManager.get(prefix + ".module.default");
        if(moduleFilePath !== undefined) {

            //TODO: se carico un modulo, che é gia caricato, non caricarlo.

            var file = FileSystem.getFileForPath(moduleFilePath);
            file.exists(function (err, status) {
                if (status) {
                    _load(moduleFilePath, function(error, module){
                        if(error){
                            $deferred.fail(error);
                        }
                        else{
                            $deferred.resolve(module);
                        }
                    });
                }
                else {
                    _load(moduleDefaultFilePath, function(error, module){
                        if(error){
                            $deferred.fail(error);
                        }
                        else{
                            $deferred.resolve(module);
                        }
                    });
                }
            });
        }
        else{
            _load(moduleDefaultFilePath, function(error, module){
                if(error){
                    $deferred.fail(error);
                }
                else{
                    $deferred.resolve(module);
                }
            });
        }
        return $deferred.promise();
    }

    /**
     * Unloads the current module
     * @param {Object} module the module to unload
     */
    function unloadModule(modulePath){
        var $deferred = new $.Deferred();
        try {
            var module = _modules[modulePath];
            if (module) {
                module.dispose();
                module = null;
                _modules.splice(_modules.indexOf(modulePath), 1);
            }
            $deferred.resolve();
        }
        catch(error){
            $deferred.fail(error);
        }
        return $deferred.promise();
    }

    /**
     * Loads the specified module
     * @param {String} modulePath the path to javascript module
     * @param {Function} callback - call backs errors or the loaded module
     * @private
     */
    function _load(modulePath, callback){

        unloadModule(modulePath)
            .done(function(){
                require([modulePath], function (res) {
                    var _mod = res;
                    _mod.init("");
                    _modules[modulePath] = _mod;
                    callback(null, _mod);
                });
            })
            .fail(function(err){
                callback(err);
            });
    }

    exports.loadModule = loadModule;

});