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
 * date:        11 Sep 2015
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var NodeDomain          = require("utils/NodeDomain"),
        FileUtils           = require("file/FileUtils"),
        EventDispatcher     = require("utils/EventDispatcher");


    var domainPath = FileUtils.getNativeBracketsDirectoryPath() + "/" + FileUtils.getNativeModuleDirectoryPath(module) + "/node/SerialDomain";
    var serialDomain      = new NodeDomain("arduino-serial-domain", domainPath);

    /**
     * NOTE: when create a serial port object, open it and attach listener to receive data from serial connection, and then create a second serial port object
     * to the same serial path (COM1, or /dev/tty.usbmodem1421) and attach a listener, this last listener will not receives any data from serial connection,
     * you need to call the open methods on the second serial port object, to receive data:
     *
     * var serialport = require("arduino/SerialPort").SerialPort;
     * var sp = new serialport("/dev/tty.usbmodem1421",9600);
     *
     * sp.open().done(function(status){console.log(status);}).fail(function(status){console.log(status);});
     * sp.on("data",function($evt, data){console.log("@SP:" + data);});
     *
     * var sp2 = new serialport("/dev/tty.usbmodem1421",9600);
     * sp2.open().done(function(status){console.log(status);}).fail(function(status){console.log(status);}); // this is necessary also if the port is already opened
     * sp2.on("data",function($evt, data){console.log("@SP2:" + data);});
     *
     *
     */


    /**
     * @constructor
     * Create a SerialPort object.
     *
     * @param {String} address Identification of serial port (e.g. COM1, /dev/tty0)
     * @param {Number} Baud Rate Baud rate for serial connection
     */
    function SerialPort(address, baudRate) {
        this.address = address;
        this.baudRate = baudRate || 9600;

        //TODO manage the promise callback - done and fail
        serialDomain.exec("create", this.address, parseInt(this.baudRate, 10));

    }

    EventDispatcher.makeEventDispatcher(SerialPort.prototype);

    //function _attachHandlers(ref){
    //    var _handleSerialData = function($evt, port, data){
    //        if(ref.address.localeCompare(port) === 0 ) {
    //            ref.trigger("data", data);
    //        }
    //    };
    //
    //    var _handleSerialClose = function($evt, port){
    //        if(ref.address.localeCompare(port) === 0 ) {
    //            ref.trigger("close");
    //        }
    //    };
    //
    //    var _handleSerialError = function($evt, port, error){
    //        if(ref.address.localeCompare(port) === 0 ) {
    //            ref.trigger("error", error.toString());
    //        }
    //    };
    //
    //    serialDomain.on('data', _handleSerialData);
    //    serialDomain.on('close', _handleSerialClose);
    //    serialDomain.on('error', _handleSerialError);
    //}

    /**
     * Opens the connection to serial port, only if connection is not already opened
     *
     * @return {jQuery.Promise} this promise resolve true when the serial port is opened or reject an error.
     */
    SerialPort.prototype.open = function(){
        var $deferred = $.Deferred(),
            that = this;
        serialDomain.exec("open", that.address)
        .done( function(result){
            //_attachHandlers(that);

            function _handleSerialData($evt, port, data) {
                if (that.address.localeCompare(port) === 0) {
                    that.trigger("data", data);
                }
            }

            function _handleSerialClose($evt, port) {
                if (that.address.localeCompare(port) === 0) {
                    that.trigger("close");
                }
            }

            function _handleSerialError($evt, port, error) {
                if (that.address.localeCompare(port) === 0) {
                    that.trigger("error", error.toString());
                }
            }

            if( !serialDomain._eventHandlers || ( !serialDomain._eventHandlers.close || !serialDomain._eventHandlers.data || !serialDomain._eventHandlers.error) ) {
                serialDomain.on('data', _handleSerialData);
                serialDomain.on('close', _handleSerialClose);
                serialDomain.on('error', _handleSerialError);
            }

            $deferred.resolve(result);
        })
        .fail(function(error) {
            $deferred.reject(error);
        });

        return $deferred.promise();
    };

    /**
     * Closes the connection to the serial port
     *
     * @return {promise}
     */
    SerialPort.prototype.close = function(){
        var $deferred = $.Deferred();
        serialDomain.exec("close", this.address)
            .done( function(result){
                $deferred.resolve(result);
            })
            .fail(function(error) {
                $deferred.reject(error);
            });

        serialDomain.off("data");       //remove listener between this and node domain
        serialDomain.off("close");
        serialDomain.off("error");
        this.off("data");               //remove listeners between this and user space
        return $deferred.promise();
    };

    /**
     * Sends message trough the serial connection
     *
     * @param {String} message The message to transmit via serial connection
     */
    SerialPort.prototype.write = function(message){
        var $deferred = $.Deferred();
        if(message) {
            serialDomain.exec("write", this.address, message)
                .done( function(result){
                    $deferred.resolve(result);
                })
                .fail(function(error) {
                    $deferred.reject(error);
                });
        }
        else{
            //TODO locate this message
            $deferred.reject("Empty message");
        }
        return $deferred.promise();
    };

    /**
     * Says if the connection is open
     *
     * @return {promise}
     */
    SerialPort.prototype.isOpen = function(){
        var $deferred = $.Deferred();
        serialDomain.exec("isOpen", this.address)
            .done( function(status){
                $deferred.resolve(status);
            })
            .fail(function(err) {
                $deferred.reject(err);
            });
        return $deferred.promise();
    };

    // Public API
    exports.SerialPort = SerialPort;
});
