function setupVideo(modes, vid, onPlay){
    var streaming = false;
    function getUserMediaFallthrough(vidOpt, success, err){
        navigator.getUserMedia({video: vidOpt}, function (stream) {
            var stream = window.URL.createObjectURL(stream);
            vid.src = stream;
            success();
        }, err);
    };

    function tryModesFirstThen(source, err, i){
        i = i || 0;
        if(i < modes.length){
            var w = modes[i].w;
            var h = modes[i].h;
            getUserMediaFallthrough({
                optional: [{ sourceId: source }],
                mandatory: {
                    minWidth: w,
                    minHeight: h
                }
            }, function(){
                console.log(fmt("Connected to camera at [w:$1, h:$2].", w, h));
            }, function(err){
                console.error(fmt("Failed to connect at [w:$1, h:$2]. Reason: $3", w, h, err));
                tryModesFirstThen(source, err, i+1);
            });
        }
        else{
            err();
        }
    }


    function connect(source) {
        try {
            if (streaming) {
                if (window.stream) {
                    window.stream.stop();
                }
                vid.src = null;
                streaming = false;
            }
        }
        catch (err) {
            console.error("While stopping", err);
        }

        tryModesFirstThen(source, function(err){
            console.error("While connecting", err);
            getUserMediaFallthrough(true,
                console.log.bind(console, "Connected to camera at default resolution"),
                console.error.bind(console, "Final connect attempt"));
        });
    }

    vid.addEventListener("canplay", function (ev) {
        if (!streaming) {
            streaming = true;
        }
    }, false);

    if(onPlay){
        vid.addEventListener("playing", onPlay, false);
    }
    
    MediaStreamTrack.getVideoTracks(function (infos) {

        //the last one is most likely to be the back camera of the phone
        //TODO: setup this up to be configurable.
        connect(infos[infos.length - 1].id);
    });
}