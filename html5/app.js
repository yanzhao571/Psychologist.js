var command = "", 
    commandTimeout = 0,
    state = "look",
    CANV_WIDTH = Math.floor(1920 * 0.4),
    CANV_HEIGHT = 1080,
    ASPECT_RATIO = CANV_HEIGHT / CANV_WIDTH,
    orient = "", 
    zeroVector = {x:0,y:0,z:0}, 
    gamma = 0, 
    beta = 0, 
    alpha = 0, 
    upDirection, 
    upC, 
    leftVid,
    rightVid, 
    leftEye, 
    rightEye,
    overlay,
    vidSize = 84;

function pageLoad() {
    leftVid = document.getElementById("leftVid");
    rightVid = document.getElementById("rightVid");

    leftEye = new Surface("leftEye", true);
    rightEye = new Surface("rightEye");
        
    setupVideo(leftVid);//, rightVid);
    
    if(false) setupSpeech(function(cmd){
        command = cmd;
        switch(cmd){
            case "look":
                state = "look";
                break;
            case "stop":
                state = "none";
                break;
            case "bigger":
                vidSize += 0.5;
                resetVideoSize();
                break;
            case "smaller":
                if(vidSize > 0.5){
                    vidSize -= 0.5;
                    resetVideoSize();
                }
                break;
        }
    });

    //setupOrientation(function(g,b,a){
    //    gamma = g;
    //    beta = b;
    //    alpha = a;
    //    orient = fmt("g: $1.0 b: $2.0 a: $3.0", g, b, a);
    //});

    //setupScene(leftEye, "fragmentShader", "vertexShader");

    window.requestAnimationFrame(draw);
}

function resetVideoSize(){
    vid.style.width 
        = vid.style.height 
        = pct(vidSize);
    vid.style.left 
        = vid.style.top
        = pct(0.5 * (100 - vidSize));
}

function cmd_look(){
    leftEye.canv.style.display = "none";
    rightEye.canv.style.display = "none";
    leftVid.style.display = "block";
    rightVid.style.display = "block";
}

function cmd_none(){
    leftEye.canv.style.display = "block";
    rightEye.canv.style.display = "block";
    leftVid.style.display = "none";
    rightVid.style.display = "none";
}

function draw(){ 
    //leftEye.clear();
    //rightEye.clear();
    var cmd = "cmd_" + state;
    if(window[cmd]){
        window[cmd]();
    }
    //var msg = fmt("state: $1\ncommand: $2\n$3", state, command, orient);
    //var y = CANV_HEIGHT / 2 - 100;
    //leftEye.drawTextBox(msg, y, 25, "#ffffff");
    //rightEye.drawTextBox(msg, y, 25, "#ffffff");
    //drawScene(leftEye);
    //rightEye.drawImage(leftEye);
    window.requestAnimationFrame(draw);
}