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
        if(!options[key]){
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