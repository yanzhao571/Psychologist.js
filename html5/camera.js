function setupVideo(width, height, vid, onPlay){
    var streaming = false;
    function getUserMediaFallthrough(vidOpt, err){
        navigator.getUserMedia({video: vidOpt}, function (stream) {
            var stream = window.URL.createObjectURL(stream);
            vid.src = stream;
        }, err);
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

        getUserMediaFallthrough({
            optional: [{ sourceId: source }],
            mandatory: {
                minWidth: width,
                minHeight: height
            }
        }, function(err){
            console.error("While connecting", err);
            getUserMediaFallthrough(true, console.error.bind(window, "Final connect attempt"));
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