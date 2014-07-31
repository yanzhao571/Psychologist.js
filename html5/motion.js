var ZERO_VECTOR = { x: -9.80665, y: 0, z: 0 }, ZERO_EULER = {gamma: 90, alpha: 0, beta: 0};

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

function Corrector(isChrome){
    var acceleration, orientation, 
        deltaAlpha, signAlpha, heading, 
        deltaGammaPitch, deltaBetaPitch, signGammaPitch, signBetaPitch, pitch,
        deltaGammaRoll, deltaBetaRoll, signGammaRoll, signBetaRoll, roll,
        omx, omy, omz, osx, osy, osz, isLandscape, isPrimary, isAboveHorizon, isClockwise;

    signAlpha = -1;

    function calculate(){
        omx = Math.abs(acceleration.x);
        omy = Math.abs(acceleration.y);
        omz = Math.abs(acceleration.z);

        osx = (omx > 0) ? acceleration.x / omx : 1;
        osy = (omy > 0) ? acceleration.y / omy : 1;
        osz = (omz > 0) ? acceleration.z / omz : 1;

        isAboveHorizon = osz == 1;
        isClockwise = osy == (isPrimary ? -1 : 1);

        if(omx > omy && omx > omz && (omx > 4.5 || orientationName == null)){
            isLandscape = true;
            isPrimary = osx == -1;
        }
        else if(omy > omz && omy > omx && (omy > 4.5 || orientationName == null)){
            isLandscape = false;
            isPrimary = osy == 1;
        }

        deltaAlpha = (isChrome && (isAboveHorizon ^ isPrimary) || !isChrome && isPrimary) ? 270 : 90;

        heading = signAlpha * orientation.alpha + deltaAlpha;
        pitch = signGammPitch * orientation.gamma + deltaGammaPitch + signBetaPitch * orientation.beta + deltaBetaPitch;
        roll = signGammRoll * orientation.gamma + deltaGammaRoll + signBetaRoll * orientation.beta + deltaBetaRoll;
    }

    this._defineSetter__("acceleration", function(v){
        acceleration = v;
        calculate();
    });

    this._defineSetter__("orientation", function(v){
        orientation = v;
        calculate();
    });

    this.__defineGetter__("heading", function(){
        return alpha;
    });

    this.__defineGetter__("pitch", function(){
        return pitch;
    });

    this.__defineGetter__("roll", function(){
        return roll;
    });
};

Corrector.prototype.setAcceleration = function(v){
    this.acceleration = v;
};

Corrector.prototype.setOrientation = function(v){
    this.orientation = v;
};

function setupOrientation(callback) {
    var acceleration = ZERO_VECTOR, rotation = ZERO_EULER, orientation = ZERO_EULER,
        beta = new Angle(0), gamma = new Angle(0), alpha = new Angle(0),
        isAboveHorizon, isLandscape, isPortrait, isPrimary, isSecondary, orientationName,
        omx, omy, omz, osx, osy, osz, da, db, dg, sa = -1, sb, sg;

    function onChange(){
        if(callback){
            callback({
                orientation: orientationName,
                pitch: gamma.radians, 
                roll: beta.radians, 
                heading: alpha.radians,
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
        orientation = (!!event && event.alpha !== null && event) || ZERO_EULER;
        isAboveHorizon = acceleration.z < 0;

        da = (isChrome && (isAboveHorizon ^ isPrimary) 
          || isFirefox && isPrimary) ? 270 : 90;

        if(!isAboveHorizon){
            db = 0;
            dg = -90;
            if(isSecondary){
                sb = 1;
                sg = -1;
            }
            else{
                sb = -1;
                sg = 1;
            }
        }
        else{
            db = 180;
            dg = 90;            
            if(isSecondary){
                sb = -1;
                sg = -1;
            }
            else{
                sb = 1;
                sg = 1;
            }
        }
        alpha.degrees = sa * orientation.alpha + da;
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

        isLandscape = orientationName && orientationName.indexOf("landscape") == 0;
        isPortrait = orientationName && orientationName.indexOf("portrait") == 0;
        isPrimary = orientationName && orientationName.indexOf("primary") > 0;
        isSecondary = orientationName && orientationName.indexOf("secondary") > 0;

        onChange();
    }
    window.addEventListener("devicemotion", checkMotion, false);

    checkMotion();
    checkOrientation();
}