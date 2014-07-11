function setupVideo(vid){
    var streaming = false;

    function getUserMediaFallthrough(vidOpt, err){
        navigator.getUserMedia({video: vidOpt}, function (stream) {
            vid.src = window.URL.createObjectURL(stream);
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

        getUserMediaFallthrough({optional: [{ sourceId: source }]}, function(err){
            console.error("While connecting", err);
            getUserMediaFallthrough(true, console.error.bind(window, "Final connect attempt"));
        });
    }

    vid.addEventListener("canplay", function (ev) {
        if (!streaming) {
            streaming = true;
        }
    }, false);
    
    MediaStreamTrack.getVideoTracks(function (infos) {

        //the last one is most likely to be the back camera of the phone
        //TODO: setup this up to be configurable.
        connect(infos[infos.length - 1].id);
    });
}