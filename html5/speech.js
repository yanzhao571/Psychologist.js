function Speech(commands){
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
        this.errorMessage = err.message;
        this.start = this.stop = function(){
            var msg = fmt("Failed to initialize speech engine. Reason: $1", err.message);
            console.error(msg);
            return msg;
        };
    }
}