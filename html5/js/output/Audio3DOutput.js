function Audio3DOutput(){
    this.audioContext = new AudioContext();
    this.mainVolume = this.audioContext.createGain();
    this.mainVolume.connect(this.audioContext.destination);

    this.setPosition = this.audioContext.listener.setPosition.bind(this.audioContext.listener);
    this.setVelocity = this.audioContext.listener.setVelocity.bind(this.audioContext.listener);
    this.setOrientation = this.audioContext.listener.setOrientation.bind(this.audioContext.listener);
}

Audio3DOutput.prototype.loadSound = function(src, loop, progress, success){
    var error = function(){ 
        progress("error", src); 
    };
    progress("loading", src);
    GET(src, "arraybuffer", function(evt){ 
        progress("intermediate", src, evt.loaded); 
    }, error, function(response){
        progress("success", src);
        this.audioContext.decodeAudioData(response, function(buffer){
            var snd = {
                volume: this.audioContext.createGain(),
                source: this.audioContext.createBufferSource()
            };
            snd.source.buffer = buffer;
            snd.source.loop = loop;
            success(snd);
        }.bind(this), error);
    }.bind(this));
};

Audio3DOutput.prototype.loadSound3D = function(src, loop, x, y, z, progress, success){
    this.loadSound(src, loop, progress, function(snd){
        snd.panner = this.audioContext.createPanner();
        snd.panner.setPosition(x, y, z);
        snd.panner.connect(this.mainVolume);
        snd.volume.connect(snd.panner);
        snd.source.connect(snd.volume);
        success(snd);
    }.bind(this));
};

Audio3DOutput.prototype.loadSoundFixed = function(src, loop, progress, success){
    this.loadSound(src, loop, progress, function(snd){
        snd.volume.connect(this.mainVolume);
        snd.source.connect(snd.volume);
        success(snd);
    }.bind(this));  
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