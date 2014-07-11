function setupSpeech(func){
    var command = "";
    var recognition = new webkitSpeechRecognition();
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
        command = Array.prototype.map.call(event.results, function(evt){
            return evt[0].transcript;
        }).filter(function(e,i){
            return i >= event.resultIndex;
        }).join(" ").trim().toLowerCase();

        func(command);

        commandTimeout = setTimeout(function(){
            command = "";
            delete commandTimeout;
        }, 3000);
    }, true);
    recognition.start();
}