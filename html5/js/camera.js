function setupVideo(modes, vid, onPlay){
    var streaming = false;
    vid.autoplay = 1;
    function getUserMediaFallthrough(vidOpt, success, err){
        navigator.getUserMedia({video: vidOpt}, function (stream){
            var stream = window.URL.createObjectURL(stream);
            vid.src = stream;
            success();
        }, err);
    };

    function tryModesFirstThen(source, err, i){
        i = i || 0;
        if(modes && i < modes.length){
            var mode = modes[i];
            var opt = {
                optional: [{ sourceId: source }]
            };
            if(mode !== "default"){
                opt.mandatory = {
                    minWidth: mode.w,
                    minHeight: mode.h
                };
                mode = fmt("[w:$1, h:$2]", mode.w, mode.h);
            }
            getUserMediaFallthrough(opt, function(){
                console.log(fmt("Connected to camera at mode $1.", mode));
            }, function(err){
                console.error(fmt("Failed to connect at mode $1. Reason: $2", mode, err));
                tryModesFirstThen(source, err, i+1);
            });
        }
        else{
            err();
        }
    }


    function connect(source){
        try {
            if (streaming){
                if (window.stream){
                    window.stream.stop();
                }
                vid.src = null;
                streaming = false;
            }
        }
        catch (err){
            console.error("While stopping", err);
        }

        tryModesFirstThen(source, function(err){
            console.error("Couldn't connect at requested resolutions. Reason: ", err);
            getUserMediaFallthrough(true,
                console.log.bind(console, "Connected to camera at default resolution"),
                console.error.bind(console, "Final connect attempt"));
        });
    }

    vid.addEventListener("canplay", function (ev){
        if (!streaming){
            streaming = true;
        }
    }, false);

    if(onPlay){
        vid.addEventListener("playing", onPlay, false);
    }
    
    MediaStreamTrack.getVideoTracks(function (infos){

        //the last one is most likely to be the back camera of the phone
        //TODO: setup this up to be configurable.
        connect(infos && infos.length > 0 && infos[infos.length - 1].id);
    });
}

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