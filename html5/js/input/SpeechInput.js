/*
    Class: SpeechInput
        
        Connects to a the webkitSpeechRecognition API and manages callbacks based on
        keyword sets related to the callbacks. Note that the webkitSpeechRecognition
        API requires a network connection, as the processing is done on an external
        server.

    Constructor: new SpeechInput(name, commands, socket);

        The `name` parameter is used when transmitting the commands through the command
        proxy server.

        The `commands` parameter specifies a collection of keywords tied to callbacks
        that will be called when one of the keywords are heard. Each callback can
        be associated with multiple keywords, to be able to increase the accuracy
        of matches by combining words and phrases that sound similar.

        Each command entry is a simple object following the pattern:
        
        {
            "keywords": ["phrase no. 1", "phrase no. 2", ...],
            "command": <callbackFunction>
        }

        The `keywords` property is an array of strings for which SpeechInput will
            listen. If any of the words or phrases in the array matches matches the heard
            command, the associated callbackFunction will be executed.
        
        The `command` property is the callback function that will be executed. It takes no
            parameters.

        The `socket` (optional) parameter is a WebSocket connecting back to the command
        proxy server.

    Methods:
        `start()`: starts the command unrecognition, unless it's not available, in which
            case it prints a message to the console error log. Returns true if the running 
            state changed. Returns false otherwise.

        `stop()`: uhm... it's like start, but it's called stop.

        `isAvailable()`: returns true if the setup process was successful.

        `getErrorMessage()`: returns the Error object that occured when setup failed, or 
            null if setup was successful.

*/
function SpeechInput(name, commands, socket){
    NetworkedInput.call(this, name, commands, socket);
    var command = "",
        running = false,
        recognition = null,
        errorMessage = null;

    function warn(){
        var msg = fmt("Failed to initialize speech engine. Reason: $1", err.message);
        console.error(msg);
        return false;
    }

    function start(){
        if(!this.available){
            return warn();
        }
        else if(!running){
            running = true;
            recognition.start();
            return true;
        }
        return false;
    }

    function stop(){
        if(!this.available){
            return warn();
        }
        if(running){
            recognition.stop();
            return true;
        }
        return false;
    }

    this.check = function(){
        if(this.enabled && !running){
            start();
        }
        else if(!this.enabled && running){
            stop();
        }
    }
    
    this.getErrorMessage = function(){
        return errorMessage;
    };

    function executeCommand(command){
        var found = false;
        for(var i = 0; i < commands.length && !found; ++i){
            var cmd = commands[i];
            for(var j = 0; j < cmd.keywords.length && !found; ++j){
                if(cmd.preamble && command.indexOf(cmd.keywords[j]) == 0
                    || cmd.keywords[j] == command){
                    found = true;
                    if(cmd.preamble){
                        command = command.substring(cmd.keywords[j].length);
                    }
                    cmd.command(command);
                }
            }
        }
        if(!found){
            console.log("Unknown command: " + command);
        }
        return found;
    }

    // clone the arrays, so the consumer can't add elements to it in their own code.
    commands = commands.slice();
                
    try{
        if(window.SpeechRecognition){
            // just in case this ever gets standardized
            recognition = new SpeechRecognition(); 
        }
        else{
            // purposefully don't check the existance so it errors out and setup fails.
            recognition = new webkitSpeechRecognition(); 
        }
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        var restart = false;
        recognition.addEventListener("start", function(){
            console.log("speech started");
            command = ""; 
        }, true);

        recognition.addEventListener("error", function(event){
            restart = true;
            console.log("speech error", event);
            running = false;
            command = "speech error";
        }, true);

        recognition.addEventListener("end", function(){
            console.log("speech ended", arguments);
            running = false;
            command = "speech ended";
            if(restart){
                restart = false;
                this.start();
            }
        }, true);

        recognition.addEventListener("result", function(event){ 
            var newCommand = "";
            for(var i = 0; i < event.results.length; ++i){
                if(i >= event.resultIndex && event.results[i].length > 0){
                    newCommand += event.results[i][0].transcript.trim() + " ";
                }
            }

            newCommand = newCommand.trim().toLowerCase();

            if(newCommand != this.inputState){
                this.inputState = newCommand;
            }
        }, true);

        this.available = true;
    }
    catch(err){
        errorMessage = err;
        this.available = false;
    }
}

inherit(SpeechInput, NetworkedInput);

SpeechInput.prototype.enable = function(k, v){
    NetworkedInput.prototype.enable.call(this, k, v);
    this.check();
};

SpeechInput.prototype.transmit = function(v){
    NetworkedInput.prototype.transmit.call(this, v);
    this.check();
};

/*
https://www.github.com/capnmidnight/VR
Copyright (c) 2014 Sean T. McBeth
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, 
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this 
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, this 
  list of conditions and the following disclaimer in the documentation and/or 
  other materials provided with the distribution.

* Neither the name of Sean T. McBeth nor the names of its contributors
  may be used to endorse or promote products derived from this software without 
  specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
OF THE POSSIBILITY OF SUCH DAMAGE.
*/
