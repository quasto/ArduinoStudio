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
 * authors:     marcello@arduino.org
 * date:        21 Oct 2015
 */


//"use strict";

var mdns  = require('mdns'),
    _     = require('lodash'),
    serviceTypeArduino = new mdns.ServiceType('_arduino._tcp'),
    boardsUp = [];

//The boardport object.... should be improve as a 'class' with encapusalation
//	{
//		address : "/dev/tty.usbmodem1421",   (or "192.168.1.100")	//comunication info
//      host    : "linino.local"
//		name    : "Arduino Magic Board",							//name of the board
//		vid     : "0x2a03",											//vendor id
//		pid     : "0x1234",											//product id
//		label   : "/dev/tty.usbmodem1421 - Arduino Magic Board",	//presentation name
//		protocol: "serial" (or network)								//communication protocol
//		manufacturer : "Arduino Srl"								//manufacturer name
//	}

//TODO: la tian trasmette 2 indirizzi [ipv6 e ipv4]: https://github.com/whitequark/ipaddr.js
//TODO: creare oggetti per board network e board serial
//TODO: quando la board viene staccata,

//function extractInfo(info){
//    var board = {}
//    board.address = info.addresses[0];
//    board.host = _.trimRight(info.host, ".");
//    board.name = _.capitalize( info.txtRecord.board );
//    board.distro = info.txtRecord.distro_version;
//    board.label = board.name + " ("+ board.host + ")";
//    board.protocol = "network";
//    return board;
//}

function getBoardsUp(callback){
    boardsUp = [];
    var browser = mdns.createBrowser(serviceTypeArduino);
    browser.on('serviceUp', function(info) {
        if(!_.find(boardsUp, info)) {
            boardsUp.push(info);
        }
    });
    browser.start();
    setTimeout(function() {
        browser.stop();
        callback(null, boardsUp);
    }, 600);
}

exports.list = function(callback){
    getBoardsUp(function(err, res){
        callback(err, res);
    });
};