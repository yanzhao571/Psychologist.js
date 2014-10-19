function LeapMotionInput(name, buttonBounds, axisConstraints, commands, socket, oscope){
    this.buttonBounds = buttonBounds || [];
    for(var i = this.buttonBounds.length - 1; i >= 0; --i){
        var b = this.buttonBounds[i];
        b.x2 = b.x + b.w;
        b.y2 = b.y + b.h;
        b.z2 = b.z + b.d;
    }
    ButtonAndAxisInput.call(this, name, axisConstraints, commands, socket, oscope, 1, LeapMotionInput.AXES);
    
    this.controller = new Leap.Controller({ enableGestures: true });
}
inherit(LeapMotionInput, ButtonAndAxisInput);

LeapMotionInput.CONNECTION_TIMEOUT = 5000;
LeapMotionInput.prototype.E = function (e, f){
    if(f){
        this.controller.on(e, f);            
    }
    else{
        this.controller.on(e, console.log.bind(console, "leap " + e));
    }
};

LeapMotionInput.prototype.start = function(gameUpdateLoop){
    console.log("starting");
    if(this.isEnabled()){
        if(gameUpdateLoop){
            console.log("creating fallback");
            console.log("events setup");
            var alternateLooper = function(t){
                requestAnimationFrame(alternateLooper);
                gameUpdateLoop(t);
            };
            var startAlternate = requestAnimationFrame.bind(window, alternateLooper);
            var timeout = setTimeout(startAlternate, LeapMotionInput.CONNECTION_TIMEOUT);
            var canceller = clearTimeout.bind(window, timeout);
            this.E("connect");
            this.E("focus");
            this.E("blur");
            this.E("protocol");
            this.E("deviceStreaming", canceller);
            this.E("streamingStarted", canceller);
            this.E("streamingStopped", startAlternate);
            this.E("deviceStopped");
            this.E("disconnect");
            console.log("fallback created");
        }  
        this.controller.on("frame", this.setState.bind(this, gameUpdateLoop));  
        this.controller.connect();
    }
};

LeapMotionInput.COMPONENTS = ["X", "Y", "Z"];

LeapMotionInput.prototype.setState = function(gameUpdateLoop, frame){
    for(var i = 0; i < frame.hands.length; ++i){
        var hand = frame.hands[i].palmPosition;
        var handName = "HAND" + i;
        for(var j = 0; j < LeapMotionInput.COMPONENTS.length; ++j){
            this.setAxis(handName + LeapMotionInput.COMPONENTS[j], hand[j]);
        }
    }
    
    for(var i = 0; i < frame.fingers.length; ++i){
        var finger = frame.fingers[i];
        var fingerName = "FINGER" + i;
        for(var j = 0; j < LeapMotionInput.FINGER_PARTS.length; ++j){
            var joint = finger[LeapMotionInput.FINGER_PARTS[j] + "Position"];
            var jointName = fingerName + LeapMotionInput.FINGER_PARTS[j].toUpperCase();
            for(var k = 0; k < LeapMotionInput.COMPONENTS.length; ++k){
                this.setAxis(jointName + LeapMotionInput.COMPONENTS[k], joint[k]);
            }
        }
    }
    
    for(var i = 0; i < this.buttonBounds.length; ++i){
        var b = this.buttonBounds[i];
        this.setButton(i, false);
        for(var j = 0; j < frame.gestures.length; ++j){
            var gesture = frame.gestures[j];
            if(gesture.type === "keyTap"){
                var p = gesture.position;
                if(b.x <= p[0] && p[0] < b.x2
                    && b.y <= p[1] && p[1] < b.y2
                    && b.z <= p[2] && p[2] < b.z2){
                    this.setButton(i, true);
                }
            }
        }
    }
    
    if(gameUpdateLoop){
        gameUpdateLoop(frame.timestamp * 0.001);
    }
};

LeapMotionInput.AXES = [];
LeapMotionInput.NUM_HANDS = 2;
for(var i = 0; i < LeapMotionInput.NUM_HANDS; ++i){
    var h = "HAND" + i;
    LeapMotionInput.AXES.push(h + "X");
    LeapMotionInput.AXES.push(h + "Y");
    LeapMotionInput.AXES.push(h + "Z");
}

LeapMotionInput.NUM_FINGERS = 10;
LeapMotionInput.FINGER_PARTS = ["tip", "dip", "pip", "mcp", "carp"];
for(var i = 0; i < LeapMotionInput.NUM_FINGERS; ++i){
    LeapMotionInput.FINGER_PARTS.map(function(p){
        return "FINGER" + i + p.toUpperCase();
    }).forEach(function(f){
        LeapMotionInput.AXES.push(f + "X");
        LeapMotionInput.AXES.push(f + "Y");
        LeapMotionInput.AXES.push(f + "Z");
    });
}

ButtonAndAxisInput.fillAxes(LeapMotionInput);