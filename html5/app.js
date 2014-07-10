var streaming = false, sources = [], command = "", commandTimeout, state = "none", CANV_WIDTH = Math.floor(1920 * 0.4), CANV_HEIGHT = 1080, gl, gr, g1, g2, status1 = "no orientation", status2 = "no total acceleration", status3 = "no gravity", status4 = "no acceleration", zeroVector = {x:0,y:0,z:0};

function setupSpeech(){
    var recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.addEventListener("start", function() {
        command = ""; 
    }, true);
    recognition.addEventListener("error", function(event) {
        command = ""; 
    }, true);
    recognition.addEventListener("end", function() {
        command = "";
        recognition.start();
    }, true);
    recognition.onresult = function(event) { 
        if(commandTimeout){
            clearTimeout(commandTimeout);
        }
        command = Array.prototype.map.call(event.results, function(evt){
            return evt[0].transcript;
        }).filter(function(e,i){
            return i >= event.resultIndex;
        }).join(" ").trim().toLowerCase();

        switch(command){
            case "look":
                state = "look";
                break;
            case "full screen": case "fullscreen":
                toggleFullScreen();
                break;
            case "done":
                state = "none";
                break;
        }

        commandTimeout = setTimeout(function(){
            command = "";
            delete commandTimeout;
        }, 3000);
    };
    recognition.start();
}

function setupVideo(){
    MediaStreamTrack.getVideoTracks(function (infos) {
        infos.reverse().forEach(function (info) {
            console.log(info);
            sources.push(info.id);
        });

        vid.addEventListener("canplay", function (ev) {
            if (!streaming) {
                streaming = true;
            }
        }, false);

        connect();
    });

    function connect() {
        try {
            if (streaming) {
                if (!!window.stream) {
                    window.stream.stop();
                }
                vid.src = null;
                streaming = false;
            }
        }
        catch (err) {
            console.error("While stopping", err);
        }

        function getUserMediaFallthrough(vidOpt, err){
            navigator.getUserMedia({video: vidOpt}, function (stream) {
                vid.src = window.URL.createObjectURL(stream);
            }, err);
        }

        getUserMediaFallthrough({optional: [{ sourceId: sources[0] }]}, function(err){
            console.error("While connecting", err);
            getUserMediaFallthrough(true, console.error.bind(window, "Final connect attempt"));
        });
    }
}

function setupOrientation(){
    window.addEventListener("deviceorientation", function(event) {
        status1 = fmt("gamma: $1.0, beta: $2.0, alpha: $3.0", event.gamma || 0, event.beta || 0, event.alpha || 0);
    }, true);
    window.addEventListener("devicemotion", function(event){
        try{
            var a = event.acceleration || zeroVector;
            var b = event.accelerationIncludingGravity || zeroVector;
            status2 = fmt("accel: <$1.0, $2.0, $3.0>", b.x, b.y, b.z);
            status3 = fmt("gravity: <$1.0, $2.0, $3.0>", b.x - a.x, b.y - a.y, b.z - a.z);
            status4 = fmt("diff: <$1.0, $2.0, $3.0>", a.x, a.y, a.z);
        }
        catch(exp){
            status2 = "motion error:";
            status3 = exp.message;
        }
    }, true);
}

function pageLoad() {
    try { 
        t("vid", "leftEye", "rightEye", "frame1", "frame2");
        leftEye.width = CANV_WIDTH;
        rightEye.width = CANV_WIDTH;
        frame1.width = CANV_WIDTH;
        frame2.width = CANV_WIDTH;

        leftEye.height = CANV_HEIGHT;
        rightEye.height = CANV_HEIGHT;
        frame1.height = CANV_HEIGHT;
        frame2.height = CANV_HEIGHT;

        gl = leftEye.getContext("2d");
        gr = rightEye.getContext("2d");
        g1 = frame1.getContext("2d");
        g2 = frame2.getContext("2d");

        gl.font = "20pt Arial";
        gr.font = "20pt Arial";

        setupSpeech();
        setupVideo();
        setupOrientation();

        window.requestAnimationFrame(draw);        
    }
    catch (exp) { console.error("While loading", exp); }
}

function draw(){
    if(streaming){
        try{
            var cx = (frame1.width - vid.videoWidth) / 2,
                cy = (frame1.height - vid.videoHeight) / 2;

            g2.drawImage(frame1, 0, 0, frame1.width, frame1.height);
            g1.drawImage(vid, cx, cy, vid.videoWidth, vid.videoHeight);
        }
        catch(exp){
            console.error("While drawing", exp);
        }
    }
    
    gl.fillStyle = "#000000";
    gr.fillStyle = "#000000";
    gl.fillRect(0, 0, leftEye.width, leftEye.height);
    gr.fillRect(0, 0, rightEye.width, rightEye.height);
    if(state == "look"){
        gl.drawImage(frame1, 0, 0, frame1.width, frame1.height);
        gr.drawImage(frame2, 0, 0, frame2.width, frame2.height);
    }
    var msg = fmt("state: $1\ncommand: $2\n$3\n$4\n$5\n$6", state, command, status1, status2, status3, status4);
    var y = leftEye.height / 2 - 100;
    drawTextBox(msg, y, 25, "#ffffff", gl, leftEye);
    drawTextBox(msg, y, 25, "#ffffff", gr, rightEye);
    window.requestAnimationFrame(draw);
}

function drawTextBox(text, y, lineHeight, color, gfx, canv){
    gfx.fillStyle = color;
    text = text.split("\n");
    var maxWidth = Math.max.apply(Math, text.map(function(line){return gfx.measureText(line).width;}));
    var cx = 0.5 * (canv.width - maxWidth);
    text.forEach(function(line, i){
        gfx.fillText(line, cx, y + lineHeight * i);
    });
}

function reload(){
    document.location = document.location.href;
}