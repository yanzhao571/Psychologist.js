function Angle(v){
    if(typeof(v) !== "number"){
        throw new Error("Angle must be initialized with a number. Initial value was: "+ v);
    }

    var value = v, delta = 0, d1, d2, d3;
   
    this.__defineSetter__("degrees", function(newValue){
        do{
            d1 = newValue + delta - value;
            d2 = Math.abs(d1 + 360);
            d3 = Math.abs(d1 - 360);
            d1 = Math.abs(d1);
            if(d2 < d1 && d2 < d3){
                delta += 360;
            }
            else if(d3 < d1){
                delta -= 360;
            }
        } while(d1 > d2 || d1 > d3);
        value = newValue + delta;
    });
   
    this.__defineGetter__("degrees", function(){
        return value;
    });
   
    this.__defineGetter__("radians", function(){
        return this.degrees * Math.PI / 180;
    });
   
    this.__defineSetter__("radians", function(val){
        this.degrees = val * 180 / Math.PI;
    });
}

function calibrateToSensors(){
    calibrated = true;
}

function setupOrientation(callback) {
    var ZERO_VECTOR = { x: 9.80665, y: 0, z: 0 }, ZERO_EULER = {gamma: 0, alpha: 0, beta: 0},
        acceleration = ZERO_VECTOR, rotation = ZERO_EULER, orientation = ZERO_EULER,
        beta = new Angle(0), gamma = new Angle(0), alpha = new Angle(0),
        belowHorizon, landscape, portrait, upsideDown, orientationName,
        omx, omy, omz, osx, osy, osz, da, db, dg, sb, sg;

    function onChange(){
        landscape = orientationName && orientationName.indexOf("landscape") == 0;
        portrait = orientationName && orientationName.indexOf("portrait") == 0;
        upsideDown = orientationName && orientationName.indexOf("secondary") > 0;
        if(callback){
            callback({
                orientation: orientationName,
                isBelowHorizon: belowHorizon,
                isLandscape: landscape,
                isPortrait: portrait,
                isUpsideDown: upsideDown,
                pitch: sigfig(gamma.degrees, 2), 
                roll: sigfig(beta.degrees, 2), 
                heading: sigfig(alpha.degrees, 2),
                sensorGamma: orientation.gamma, 
                sensorBeta: orientation.beta, 
                sensorAlpha: orientation.alpha,
                accelerationX: acceleration.x,
                accelerationY: acceleration.y,
                accelerationZ: acceleration.z,
                rotationGamma: rotation.gamma,
                rotationBeta: rotation.beta,
                rotationAlpha: rotation.alpha
            });
        }
    }

    function checkOrientation(event) {        
        orientation = event || ZERO_EULER;
        
        belowHorizon = portrait
            ? (upsideDown ? (orientation.beta >= 90) : (orientation.beta < 90))
            : (upsideDown ? (orientation.gamma < 0) : (orientation.gamma > 0))
        if(upsideDown){
            sg = -1;
            if(belowHorizon){
                da = -90;
                sb = 1;
            }
            else{
                da = 90;
                sb = -1;
            }
        }
        else{
            sg = 1;
            if(belowHorizon){
                da = 90;
                sb = -1;
            }
            else{
                da = -90;
                sb = 1;
            }
        }
        if(belowHorizon){
            db = 0;
            dg = -90;
        }
        else{
            db = 180;
            dg = 90;
        }
        alpha.degrees = orientation.alpha + da;
        beta.degrees = sb * orientation.beta + db;
        gamma.degrees = sg * orientation.gamma + dg;
        onChange();
    }
    window.addEventListener("deviceorientation", checkOrientation, false);
    
    function checkMotion(event) {
        acceleration = (event && (event.accelerationIncludingGravity || event.acceleration)) || ZERO_VECTOR;
        rotation = (event && event.rotationRate) || ZERO_EULER;

        omx = Math.abs(acceleration.x);
        omy = Math.abs(acceleration.y);
        omz = Math.abs(acceleration.z);

        osx = acceleration.x / omx;
        osy = acceleration.y / omy;
        osz = acceleration.z / omz;

        if(omx > omy && omx > omz && (omx > 4.5 || orientationName == null)){
            orientationName = "landscape-" + (osx == 1 ? "secondary" : "primary");
        }
        else if(omy > omz && omy > omx && (omy > 4.5 || orientationName == null)){
            orientationName = "portrait-" + (osy == 1 ? "primary" : "secondary");
        }

        onChange();
    }
    window.addEventListener("devicemotion", checkMotion, false);

    checkMotion();
    checkOrientation();
}