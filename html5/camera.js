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
        if(modes && i < modes.length){
            var opt = {
                optional: [{ sourceId: source }]
            };
            if(modes[i] != "default"){
                opt.mandatory = {
                    minWidth: modes[i].w,
                    minHeight: modes[i].h
                };
            }
            getUserMediaFallthrough(opt, function(){
                console.log(fmt("Connected to camera at mode $1.", modes[i]));
            }, function(err){
                console.error(fmt("Failed to connect at mode $1. Reason: $2", modes[i], err));
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
            console.error("Couldn't connect at requested resolutions. Reason: ", err);
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
        connect(infos && infos.length > 0 && infos[infos.length - 1].id);
    });
}