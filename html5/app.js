var streaming = false, command = "", commandTimeout, state = "none", CANV_WIDTH = Math.floor(1920 * 0.4), CANV_HEIGHT = 1080, gl, gr, g1, g2, orient = "", status2 = "", status3 = "", status4 = "", zeroVector = {x:0,y:0,z:0}, gamma = 0, beta = 0, alpha = 0, upDirection, upC;

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

        gl.font = "20px Arial";
        gr.font = "20px Arial";
        //setupSpeech();
        //setupVideo(vid);
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

            g2.drawImage(frame1, 0, 0, frame1.width, frame1.height);
            g1.drawImage(vid, cx, cy, vid.videoWidth, vid.videoHeight);
        }
        catch(exp){
            console.error("While drawing", exp);
        }
    }
    gl.drawImage(frame1, 0, 0, frame1.width, frame1.height);
    gr.drawImage(frame2, 0, 0, frame2.width, frame2.height);
}

function cmd_none(){
}

function clearScreen(){
    gl.fillStyle = "#000000";
    gr.fillStyle = "#000000";
    gl.fillRect(0, 0, CANV_WIDTH, CANV_HEIGHT);
    gr.fillRect(0, 0, CANV_WIDTH, CANV_HEIGHT);
}

function drawStatus(){
    var msg = fmt("state: $1\ncommand: $2\n$3", state, command, orient);
    var y = CANV_HEIGHT / 2 - 100;
    drawTextBox(msg, y, 25, "#ffffff", gl);
    drawTextBox(msg, y, 25, "#ffffff", gr);
}

function draw(){ 
    clearScreen();
    var cmd = "cmd_" + state;
    if(window[cmd]){
        window[cmd]();
    }
    drawStatus();
    window.requestAnimationFrame(draw);
}

function drawTextBox(text, y, lineHeight, color, gfx){
    gfx.fillStyle = color;
    text = text.split("\n");
    var maxWidth = Math.max.apply(Math, text.map(function(line){
        return gfx.measureText(line).width;
    }));
    var cx = 0.5 * (CANV_WIDTH - maxWidth);
    text.forEach(function(line, i){
        gfx.fillText(line, cx, y + lineHeight * i);
    });
}

function reload(){
    document.location = document.location.href;
}