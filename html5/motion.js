var Orientation = {
    // A few default values to let the code
    // run in a static view on a sensorless device.
    ZERO_VECTOR: { x: -9.80665, y: 0, z: 0 }, 
    ZERO_EULER: {gamma: 90, alpha: 0, beta: 0},

    Angle: function(v){
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

        this.__defineGetter__("degrees", function(){ return value; });
        this.__defineGetter__("radians", function(){ return this.degrees * Math.PI / 180; });
        this.__defineSetter__("radians", function(val){ this.degrees = val * 180 / Math.PI; });
    },

    Corrector: function(isChrome){
        var acceleration, orientation,
            deltaAlpha, signAlpha, heading,
            deltaGamma, signGamma, pitch,
            deltaBeta, signBeta, roll,
            omx, omy, omz, osx, osy, osz, 
            isLandscape, isPrimary, isAboveHorizon;

        signAlpha = -1;

        function wrap(v){
            while(v < 0){ v +=360; }
            while(v >= 360){ v -= 360;}
            return v;
        }

        function calculate(){
            if(acceleration && orientation){
                omx = Math.abs(acceleration.x);
                omy = Math.abs(acceleration.y);
                omz = Math.abs(acceleration.z);

                osx = (omx > 0) ? acceleration.x / omx : 1;
                osy = (omy > 0) ? acceleration.y / omy : 1;
                osz = (omz > 0) ? acceleration.z / omz : 1;

                if(omx > omy && omx > omz && omx > 4.5){
                    isLandscape = true;
                    isPrimary = osx == -1;
                }
                else if(omy > omz && omy > omx && omy > 4.5){
                    isLandscape = false;
                    isPrimary = osy == 1;
                }

                isAboveHorizon = isChrome ?  (isPrimary ? orientation.gamma > 0 : orientation.gamma < 0): osz == 1;
                deltaAlpha = (isChrome && (isAboveHorizon ^ !isPrimary) || !isChrome && isPrimary) ? 270 : 90;
                if(isPrimary){
                    if(isAboveHorizon){
                        signGamma = 1;
                        deltaGamma = -90;
                        signBeta = -1;
                        deltaBeta = 0;
                    }
                    else{
                        if(isChrome){
                            signGamma = 1;
                            deltaGamma = 90;
                        }
                        else{
                            signGamma = -1;
                            deltaGamma = 90;
                        }
                        signBeta = 1;
                        deltaBeta = 180;
                    }
                }
                else{
                    if(isAboveHorizon){
                        signGamma = -1;
                        deltaGamma = -90;
                        signBeta = 1;
                        deltaBeta = 0;
                    }
                    else{
                        if(isChrome){
                            signGamma = -1;
                            deltaGamma = 90;
                        }
                        else{
                            signGamma = 1;
                            deltaGamma = 90;
                        }
                        signBeta = -1;
                        deltaBeta = 180;
                    }
                }

                heading = wrap(signAlpha * orientation.alpha + deltaAlpha);
                pitch = wrap(signGamma * orientation.gamma + deltaGamma) - 360;
                if(pitch < -180){ pitch += 360; }
                roll = wrap(signBeta * orientation.beta + deltaBeta);
                if(roll > 180){ roll -= 360; }
            }
        }

        this.__defineSetter__("acceleration", function(v){
            acceleration = v;
            calculate();
        });

        this.__defineSetter__("orientation", function(v){
            orientation = v;
            calculate();
        });
    
        this.__defineGetter__("acceleration", function(){ return acceleration || Orientation.ZERO_VECTOR; });
        this.__defineGetter__("orientation", function(){ return orientation || Orientation.ZERO_EULER; });
        this.__defineGetter__("heading", function(){ return heading; });
        this.__defineGetter__("pitch", function(){ return pitch; });
        this.__defineGetter__("roll", function(){ return roll; });
    },

    addEventListener: function(type, callback, bubbles) {
        if(type != "motion"){
            throw new Error("The only event type that is supported is \"motion\". Type parameter was: " + type);
        }
        if(typeof(callback) != "function"){
            throw new Error("A function must be provided as a callback parameter. Callback parameter was: " + callback);
        }
        var corrector = new this.Corrector(isChrome), 
            heading = new this.Angle(0), 
            pitch = new this.Angle(0), 
            roll = new this.Angle(0);

        function onChange(){
            heading.degrees = corrector.heading;
            pitch.degrees = corrector.pitch;
            roll.degrees = corrector.roll;
            callback({
                heading: heading.radians,
                pitch: pitch.radians,
                roll: roll.radians,
                sensorAlpha: corrector.orientation.alpha,
                sensorGamma: corrector.orientation.gamma,
                sensorBeta: corrector.orientation.beta,
                accelerationX: corrector.acceleration.x,
                accelerationY: corrector.acceleration.y,
                accelerationZ: corrector.acceleration.z
            });
        }

        function checkOrientation(event) {
            corrector.orientation = (!!event && event.alpha !== null && event) || Orientation.ZERO_EULER;
            onChange();
        }

        function checkMotion(event) {
            corrector.acceleration = (!!event && (event.accelerationIncludingGravity || event.acceleration)) || Orientation.ZERO_VECTOR;
            onChange();
        }

        checkMotion();
        checkOrientation();

        window.addEventListener("deviceorientation", checkOrientation, bubbles);
        window.addEventListener("devicemotion", checkMotion, bubbles);
    }
}