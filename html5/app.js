var streaming = false, command = "", commandTimeout, state = "none", CANV_WIDTH = Math.floor(1920 * 0.4), CANV_HEIGHT = 1080, gl, gr, g1, g2, orient = "", zeroVector = {x:0,y:0,z:0}, gamma = 0, beta = 0, alpha = 0, upDirection, upC, vid, leftEye, rightEye, frame1, frame2;


function pageLoad() {
    try { 
        vid = getDOM("#vid");

        leftEye = new Surface("leftEye");
        rightEye = new Surface("rightEye");
        frame1 = new Surface("frame1");
        frame2 = new Surface("frame2");

        setupSpeech();
        setupVideo(vid);
        setupOrientation(function(g,b,a){
            gamma = g;
            beta = b;
            alpha = a;
            orient = fmt("g: $1.0 b: $2.0 a: $3.0", g, b, a);
        });

        window.requestAnimationFrame(draw);        
    }
    catch (exp) { console.error("While loading", exp); }
}

function cmd_look(){
    if(streaming){
        try{
            var cx = (frame1.width - vid.videoWidth) / 2,
                cy = (frame1.height - vid.videoHeight) / 2;

            frame2.drawImage(frame1, 0, 0);
            frame1.drawImage(vid, cx, cy);
        }
        catch(exp){
            console.error("While drawing", exp);
        }
    }
    leftEye.drawImage(frame1, 0, 0);
    rightEye.drawImage(frame2, 0, 0);
}

function cmd_none(){
}

function draw(){ 
    leftEye.clear();
    rightEye.clear();
    var cmd = "cmd_" + state;
    if(window[cmd]){
        window[cmd]();
    }
    var msg = fmt("state: $1\ncommand: $2\n$3", state, command, orient);
    var y = CANV_HEIGHT / 2 - 100;
    leftEye.drawTextBox(msg, y, 25, "#ffffff");
    rightEye.drawTextBox(msg, y, 25, "#ffffff");
    window.requestAnimationFrame(draw);
}