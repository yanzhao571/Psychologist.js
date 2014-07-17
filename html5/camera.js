function setupVideo(){
    var streaming = false;
    var args = arguments;
    function getUserMediaFallthrough(vidOpt, err){
        navigator.getUserMedia({video: vidOpt}, function (stream) {
            var stream = window.URL.createObjectURL(stream);
            Array.prototype.forEach.call(args, function(vid){
                vid.src = stream;
            });
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
                minWidth: CANV_WIDTH * 2,
                minHeight: CANV_HEIGHT
            }
        }, function(err){
            console.error("While connecting", err);
            getUserMediaFallthrough(true, console.error.bind(window, "Final connect attempt"));
        });
    }

    args[0].addEventListener("canplay", function (ev) {
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