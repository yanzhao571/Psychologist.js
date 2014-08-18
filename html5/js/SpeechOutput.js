var SpeechOutput = {

    defaultLanguage: speechSynthesis.getVoices().filter(function(v){
        return v.default;
    }).map(function(v){
        return v.lang.substring(0, 2);
    })[0],

    voices: speechSynthesis.getVoices().filter(function(v){ 
        return v.default 
            || v.localService 
            || v.lang.substring(0, 2) == this.defaultLanguage; 
    }),

    pickRandomOption: function(options, key, min, max){
        if(!options.hasOwnProperty(key)){
            options[key] = min + (max - min) * Math.random();
        }
        else{
            options[key] = Math.min(max, Math.max(min, options[key]));
        }
        return options[key];
    },

    Character: function(options){
        var msg = new SpeechSynthesisUtterance();
        options = options || {};
        msg.voice = this.voices[Math.floor(pickRandomOption(options, "voice", 0, this.voices.length))];
        msg.volume = pickRandomOption(options, "volume", 0, 1);
        msg.rate = pickRandomOption(options, "rate", 0.1, 10);
        msg.pitch = pickRandomOption(options, "pitch", 0, 2);

        this.speak = function(txt, callback){
            msg.text = txt;
            msg.onend = callback;
            speechSynthesis.speak(msg);
        };
    }
};