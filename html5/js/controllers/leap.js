include(0,
    ["lib/leap-0.6.3.min.js"],
function (){
var WIDTH = 640,
    HEIGHT = 480,
    HAND_COLORS = ["blue", "green"],
    c = findEverything(),
    g = c.canv.getContext("2d"),
    controller = new Leap.Controller(),
    lt = null, dt;

c.canv.width = WIDTH;
c.canv.height = HEIGHT;
c.canv.style.width = px(c.canv.width);
c.canv.style.height = px(c.canv.height);

function E(v, f){   
    if(f){
        controller.on(v, f);
    }
    else{
        controller.on(v, console.log.bind(console, "Leap motion: " + v));
    }
}

function leapInterpolate(frame, pos){
    var b = frame.interactionBox,
        top = b.center[1] + b.size[1] * 0.5,
        left = b.center[0] - b.size[0] * 0.5,
        x = pos[0] - left,
        y = pos[1] - top;

    x *= WIDTH / b.size[0];
    y *= HEIGHT / b.size[1];
    
    return {x: x, y: -y};
}

E("connect");
E("streamingStarted");
E("streamingStopped");
E("deviceStreaming");
E("deviceStopped");
E("ready");
E("frame", function(frame){
    if(lt !== null){
        dt = (frame.timestamp - lt) * 0.000001;
    }
    lt = frame.timestamp;
        
    g.clearRect(0, 0, WIDTH, HEIGHT);
    g.fillStyle = "black";
    g.fillRect(0, 0, WIDTH, HEIGHT);
    for( var h = 0; h < frame.hands.length; h++ ){
        g.fillStyle = HAND_COLORS[h];
        var hand = frame.hands[h];
        var p = leapInterpolate(frame, hand.palmPosition);
        g.fillRect(p.x, p.y, 20, 20);
        g.fillStyle = "red";
        for( var f = 0; f < hand.fingers.length; f++ ){
            var finger = hand.fingers[f];
            p = leapInterpolate(frame, finger.tipPosition);
            g.fillRect(p.x, p.y, 10, 10);
        }
    }
});

controller.connect();

});