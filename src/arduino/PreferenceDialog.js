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
 * date and authors:        04 Nov 2015 sergio@arduino.org
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global brackets, define, $, Mustache */

define(function (require, exports, module) {
    "use strict";
    
    var //_                           = require("thirdparty/lodash"),
        Dialogs                     = require("widgets/Dialogs"),
        DefaultDialogs              = require("widgets/DefaultDialogs"),
        //FileSystem                  = require("filesystem/FileSystem"),
        //FileUtils                   = require("file/FileUtils"),
        //Package                     = require("extensibility/Package"),
        Strings                     = require("strings"),
        //StringUtils                 = require("utils/StringUtils"),
        Commands                    = require("command/Commands"),
        CommandManager              = require("command/CommandManager"),
        PreferencesManager          = require("preferences/PreferencesManager"),
        ViewCommandHandlers         = require("view/ViewCommandHandlers"),
        Editor                      = require("editor/Editor").Editor;
        //InstallExtensionDialog      = require("extensibility/InstallExtensionDialog"),
        //AppInit                     = require("utils/AppInit");
        //Async                       = require("utils/Async"),
        //KeyEvent                    = require("utils/KeyEvent"),
        //ExtensionManager            = require("extensibility/ExtensionManager"),
        //ExtensionManagerView        = require("extensibility/ExtensionManagerView").ExtensionManagerView,
        //ExtensionManagerViewModel   = require("extensibility/ExtensionManagerViewModel");
    
    var dialogTemplate    = require("text!htmlContent/preferences-dialog.html");
    
    // bootstrap tabs component
    //require("widgets/bootstrap-tab");

    var _prefsPrefixSerialMonitor   = "arduino.panel.serialmonitor.",
        _prefsPrefixConsole         = "arduino.panel.console.",
        _prefsPrefixEditor          = "arduino.editor.",
        _prefsPrefixCompiler        = "arduino.compiler.",
        _prefsPrefixUploader        = "arduino.uploader.";

    /** Defining some preferences **/

    //showLineNumbers - e.Editor.setShowLineNumbers(true);
    //PreferencesManager.definePreference(_prefsPrefixEditor + "line_num", "boolean", true);
    //fonts.fontSize
    //PreferencesManager.definePreference(_prefsPrefixEditor + "font_size", "number", 14);


    //TODO create a model for the preferences


    var _$chkBuildVerbose,
        _$chkUploadVerbose,
        _$ddlEditorFontSize,
        _$chkEditorLineNumber,
        _$ddlSerilaMonitorMaxRows,
        _$chkSerialMonitorAutoStartConnect,
        _$chkSerialMonitorAutoReConnect,
        _$ddlConsoleMaxRows;

    
    /**
     * @private
     * Show a dialog that allows the user to browse and manage extensions.
     */
    function _showDialog() {
        var template = Mustache.render(dialogTemplate, Strings)
        var dialog = Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_INFO, Strings.DLG_PREFS_TITLE, template);//.done(function(){});

        _$chkBuildVerbose = $("#pref_chk_build_verbose");           //CHECKBOX BUILD VERBOSE
        _$chkUploadVerbose = $("#pref_chk_upload_verbose");         //CHECKBOX UPLOAD VERBOS
        _$ddlEditorFontSize = $("#pref_ddl_editor_fontsize");       //DROP DOWN LIST EDITOR FONTSIZE
        _$chkEditorLineNumber = $("#pref_chk_editor_line_num");     //CHECKBOX EDITOR LINE NUMBER
        _$ddlSerilaMonitorMaxRows = $("#pref_ddl_sm_max_rows");      //CHECKBOX SERIAL MONITOR MAX ROW
        _$chkSerialMonitorAutoStartConnect = $("#pref_chk_sm_auto_start_connect");  //CHECKBOX SERIAL MONITOR AUTO START CONNECTION
        _$chkSerialMonitorAutoReConnect = $("#pref_chk_sm_auto_reconnect");          //CHECKBOX SERIAL MONITOR AUTO RE-CONNECTION
        _$ddlConsoleMaxRows = $("#pref_ddl_console_max_rows");       //CHECKBOX CONSOLE MAX ROW

        _attachHandlers();
        _setValues();
    }

    function _setValues(){
        _$chkBuildVerbose.prop("checked", PreferencesManager.get(_prefsPrefixCompiler + "verbose"));
        _$chkUploadVerbose.prop("checked", PreferencesManager.get(_prefsPrefixUploader + "verbose"));
        _$chkEditorLineNumber.prop("checked", PreferencesManager.get("showLineNumbers"));
        _$ddlEditorFontSize.val(parseInt(PreferencesManager.get("fonts.fontSize")));
        _$chkSerialMonitorAutoStartConnect.prop("checked", PreferencesManager.get(_prefsPrefixSerialMonitor + "autostart"));
        _$chkSerialMonitorAutoReConnect.prop("checked", PreferencesManager.get(_prefsPrefixSerialMonitor + "autoreconnect"));
        _$ddlSerilaMonitorMaxRows.val(parseInt(PreferencesManager.get(_prefsPrefixSerialMonitor + "maxrow")));
        _$ddlConsoleMaxRows.val(parseInt(PreferencesManager.get(_prefsPrefixConsole + "maxrow")));
    }

    function _attachHandlers(){

        /** SECTION: BUILD & UPLOAD **/

        /** VERBOSE BUILD **/
        //$('#pref_chk_build_verbose').change(function(){
        //    PreferencesManager.set(_prefsPrefixCompiler + "verbose", this.checked);
        //});
        _$chkBuildVerbose.change(function(){
            PreferencesManager.set(_prefsPrefixCompiler + "verbose", this.checked);
        });

        /** VERBOSE UPLOAD **/
        _$chkUploadVerbose.change(function(){
            PreferencesManager.set(_prefsPrefixUploader + "verbose", this.checked);
        });

        /** SECTION: CODE EDITOR **/

        /** DISPLAY LINE NUMBERS **/
        _$chkEditorLineNumber.change(function(){
            PreferencesManager.set("showLineNumbers", this.checked);
            Editor.setShowLineNumbers(this.checked);
        });

        /** FONT SIZE **/
        _$ddlEditorFontSize.change(function(){
            var size = _$ddlEditorFontSize.find('option:selected').val() + "px";
            // ViewCommandHandlers.setFontSize set also the preference -> PreferencesManager.set("fonts.fontSize", size);
            ViewCommandHandlers.setFontSize(size);
        });

        /** SECTION: SERIAL MONITOR **/
        /** AUTO START CONNECTION **/
        _$chkSerialMonitorAutoStartConnect.change(function(){
            PreferencesManager.set(_prefsPrefixSerialMonitor + "autostart", this.checked);
        });

        /** AUTO STOP CONNECTION **/ // at the moment it is set in the same way as AUTO START CONNECTION
        _$chkSerialMonitorAutoStartConnect.change(function(){
            PreferencesManager.set(_prefsPrefixSerialMonitor + "autostop", this.checked);
        });

        /** AUTO RE-CONNECTION **/
        _$chkSerialMonitorAutoReConnect.change(function(){
            PreferencesManager.set(_prefsPrefixSerialMonitor + "autoreconnect", this.checked);
        });

        /** MAX ROW NUMBER **/
        _$ddlSerilaMonitorMaxRows.change(function(){
            var rows = $( "#pref_ddl_sm_max_rows option:selected" ).val();
            PreferencesManager.set(_prefsPrefixSerialMonitor + "maxrow", parseInt(rows));
        });

        /** SECTION: CONSOLE **/
        /** MAX ROW NUMBER **/
        _$ddlConsoleMaxRows.change(function(){
            var rows = $( "#pref_ddl_console_max_rows option:selected" ).val();
            PreferencesManager.set(_prefsPrefixConsole + "maxrow", parseInt(rows));
        });

        //CHECK FOR UPDATE
        //$('#pref_chk_checkupdate').change(function(){
        //    brackets.arduino.preferences.set( prefKey_chckupdate, this.checked);
        //});

    }


    CommandManager.register(Strings.CMD_SHOW_PREFS_DLG, Commands.FILE_OPEN_ARDUINO_PREFERENCES, _showDialog);
    
    // Unit tests
    //exports._performChanges = _performChanges;
    exports._showDialog = _showDialog;
});
