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


/*
    Class: SpeechCommandInterface
        
        Connects to a the webkitSpeechRecognition API and manages callbacks based on
        keyword sets related to the callbacks. Note that the webkitSpeechRecognition
        API requires a network connection, as the processing is done on an external
        server.

    Constructor: new SpeechCommandIinterface(commands);

        The commands parameter specifies a collaction of keywords tied to callbacks
        that will be called when one of the keywords are heard. Each callback can
        be associated with multiple keywords, to be able to increase the accuracy
        of matches by combining words and phrases that sound similar.

        Each command entry is a simple object following the pattern:
        {
            keywords: phraseList,
            command: callbackFunction
        }

        The phraseList property is an array of strings. If the heard command matches 
            any of the keywords in the list, the associated callbackFunction will be
            executed.
        
        The command property is a callback function that takes no parameters.

    Properties:
        available: returns true if the speech recognition API initialized successfully,
            false if there was an error.

        errorMessage (optional): if available has returned false, errorMessage returns
            the original Error object that occured during the failure.

    Methods:
        start(): starts the command unrecognition, unless it's not available, in which
            case it prints a message to the console error log.

        stop(): uhm... like start, but it's called stop.

*/
function SpeechCommandInterface(commands){
    try{
        var command = "",
            commandTimeout,
            running = false,
            restart = true,
            recognition = new webkitSpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.addEventListener("start", function() {
            running = true;
            command = ""; 
        }, true);

        recognition.addEventListener("error", function(event) {
            running = false;
            command = "speech error";
            if(restart){
                recognition.start();
            }
        }, true);

        recognition.addEventListener("end", function() {
            running = false;
            command = "speech ended";
            if(restart){
                recognition.start();
            }
        }, true);

        recognition.addEventListener("result", function(event) { 
            if(commandTimeout){
                clearTimeout(commandTimeout);
            }

            var newCommand = arr(event.results).map(function(evt){
                return evt[0].transcript.trim();
            }).filter(function(e,i){
                return i >= event.resultIndex;
            }).join(" ").trim().toLowerCase();

            if(newCommand != command){
                command = newCommand;
                var candidates = commands.filter(function(cmd){ return cmd && cmd.keywords && cmd.keywords.indexOf && cmd.keywords.indexOf(command) > -1;});
                console.log(candidates);
                if(candidates.length == 0){
                    console.log(fmt("Unknown command: $1", command));
                }
                else{
                    candidates[0].command();
                }
            }

            commandTimeout = setTimeout(function(){
                command = "";
                delete commandTimeout;
            }, 2000);
        }, true);

        this.start = function(){
            if(!running){
                restart = true;
                recognition.start();
            }
        };

        this.stop = function(){
            if(running){
                restart = false;
                recognition.stop();
            }
        };
        this.available = true;
    }
    catch(err){
        this.available = false;
        this.errorMessage = err;
        this.start = this.stop = function(){
            var msg = fmt("Failed to initialize speech engine. Reason: $1", err.message);
            console.error(msg);
            return msg;
        };
    }
}