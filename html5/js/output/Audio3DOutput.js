function Audio3DOutput(){
    this.audioContext = new AudioContext();
    this.mainVolume = this.audioContext.createGain();
    this.mainVolume.connect(this.audioContext.destination);

    this.setPosition = this.audioContext.listener.setPosition.bind(this.audioContext.listener);
    this.setVelocity = this.audioContext.listener.setVelocity.bind(this.audioContext.listener);
    this.setOrientation = this.audioContext.listener.setOrientation.bind(this.audioContext.listener);
}

Audio3DOutput.prototype.loadSound = function(src, loop, x, y, z, success, error){
    var request = new XMLHttpRequest();
    request.open("GET", src, true);
    request.responseType = "arraybuffer";
    request.onerror = error;
    request.onabort = error;
    request.onload = function() {
        this.audioContext.decodeAudioData(request.response, function(buffer) {
            var snd = {
                panner: this.audioContext.createPanner(),
                volume: this.audioContext.createGain(),
                source: this.audioContext.createBufferSource()
            };
            snd.panner.connect(this.mainVolume);
            snd.panner.setPosition(x, y, z);
            snd.volume.connect(snd.panner);
            snd.source.buffer = buffer;
            snd.source.loop = loop;
            snd.source.connect(snd.volume);
            success(snd);
        }.bind(this), error);
    }.bind(this);
    request.send();    
};