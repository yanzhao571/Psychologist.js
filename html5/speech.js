function setupSpeech(func){
    var command = "",
        recognition = new webkitSpeechRecognition(),
        commandTimeout;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.addEventListener("start", function() {
        command = ""; 
    }, true);

    recognition.addEventListener("error", function(event) {
        command = "speech error"; 
    }, true);

    recognition.addEventListener("end", function() {
        command = "speech ended";
        recognition.start();
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
            func(newCommand);
            command = newCommand;
        }

        commandTimeout = setTimeout(function(){
            command = "";
            delete commandTimeout;
        }, 3000);
    }, true);
    recognition.start();
}