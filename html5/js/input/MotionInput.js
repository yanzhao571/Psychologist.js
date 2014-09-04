/*
https://www.github.com/capnmidnight/VR
Copyright (c) 2014 Sean T. McBeth
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, 
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this 
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, this 
  list of conditions and the following disclaimer in the documentation and/or 
  other materials provided with the distribution.

* Neither the name of Sean T. McBeth nor the names of its contributors
  may be used to endorse or promote products derived from this software without 
  specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var LandscapeMotion = {
    // A few default values to let the code
    // run in a static view on a sensorless device.
    ZERO_VECTOR: { x: -9.80665, y: 0, z: 0 }, 
    ZERO_EULER: {gamma: 90, alpha: 270, beta: 0},

    // Set this value to "true" if you are using Google Chrome. 
    // Set it to "false" if you are using Firefox.
    // Behavior of other browsers hasn't been tested.
    BROWSER_IS_GOOGLE_CHROME: !!window.chrome && !window.opera && navigator.userAgent.indexOf(' OPR/') < 0,
    

    /*
        Class: Angle
        
            The Angle class smooths out the jump from 360 to 0 degrees. It keeps track
            of the previous state of angle values and keeps the change between angle values
            to a maximum magnitude of 180 degrees, plus or minus. This allows for smoother
            opperation as rotating past 360 degrees will not reset to 0, but continue to 361
            degrees and beyond, while rotating behind 0 degrees will not reset to 360 but continue
            to -1 and below.

            It also automatically performs degree-to-radian and radian-to-degree conversions.

        Constructor: new LandscapeMotion.Angle(initialAngleInDegrees);

            The initialAngleInDegrees value must be supplied. It specifies the initial context
            of the angle. Zero is not always the correct value. Choose a values that is as close
            as you can guess will be your initial sensor readings.
    
            This is particularly important for the 180 degrees, +- 10 degrees or so. If you expect
            values to run back and forth over 180 degrees, then initialAngleInDegrees should be
            set to 180. Otherwise, if your initial value is anything slightly larger than 180,
            the correction will rotate the angle into negative degrees, e.g.:
                initialAngleInDegrees = 0
                first reading = 185
                updated degrees value = -175

        Properties:
            degrees: get/set the current value of the angle in degrees.
            radians: get/set the current value of the angle in radians.

    */
    Angle: function(v){
        if(typeof(v) !== "number"){
            throw new Error("Angle must be initialized with a number. Initial value was: "+ v);
        }

        var value = v, delta = 0, d1, d2, d3, DEG2RAD = Math.PI / 180, RAD2DEG = 180 / Math.PI;

        this.setDegrees = function(newValue){
            do{
                // figure out if it is adding the raw value, or whole
                // rotations of the value, that results in a smaller
                // magnitude of change.
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
        };

        this.getDegrees = function(){ return value; };
        this.getRadians = function(){ return this.getDegrees() * DEG2RAD; };
        this.setRadians = function(val){ this.setDegrees(val * RAD2DEG); };
    },

    /*
        Class: Corrector
        
            The Corrector class observes orientation and gravitational acceleration values
            and determines a corrected set of orientation values that reset the orientation
            origin to 0 degrees north, 0 degrees above the horizon, with 0 degrees of tilt
            in the landscape orientation. This is useful for head-mounted displays (HMD).

        Constructor: new LandscapeMotion.Corrector([browserIsGoogleChrome]);

        Properties:
            degrees: get/set the current value of the angle in degrees.
            radians: get/set the current value of the angle in radians.

    */
    Corrector: function(isChrome){
        var acceleration, orientation,
            deltaAlpha, signAlpha, heading,
            deltaGamma, signGamma, pitch,
            deltaBeta, signBeta, roll,
            omx, omy, omz, osx, osy, osz, 
            isPrimary, isAboveHorizon;

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
                    isPrimary = osx == -1;
                }
                else if(omy > omz && omy > omx && omy > 4.5){
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

        this.setAcceleration = function(v){
            acceleration = v;
            calculate();
        };

        this.setOrientation = function(v){
            orientation = v;
            calculate();
        };
    
        this.getAcceleration = function(){ return acceleration; };
        this.getOrientation = function(){ return orientation; };
        this.getHeading = function(){ return heading; };
        this.getPitch = function(){ return pitch; };
        this.getRoll = function(){ return roll; };
    },

    /*
        Add an event listener for motion/orientation events. 
    
        Parameters:
            type: There is only one type of event, called "deviceorientation". Any other value for type will result 
                in an error. It is included to maintain interface compatability with the regular DOM event handler
                syntax, and the standard device orientation events.
            
            callback: the function to call when an event occures

            [bubbles]: set to true if the events should be captured in the bubbling phase. Defaults to false. The 
                non-default behavior is rarely needed, but it is included for completeness.
    */
    addEventListener: function(type, callback, bubbles) {
        if(type != "deviceorientation"){
            throw new Error("The only event type that is supported is \"deviceorientation\". Type parameter was: " + type);
        }
        if(typeof(callback) != "function"){
            throw new Error("A function must be provided as a callback parameter. Callback parameter was: " + callback);
        }

        var corrector = new this.Corrector(LandscapeMotion.BROWSER_IS_GOOGLE_CHROME), 
            heading = new this.Angle(0), 
            pitch = new this.Angle(0), 
            roll = new this.Angle(0),
            o, a;

        function onChange(){
            o = corrector.getOrientation();
            a = corrector.getAcceleration();
            if(o && a){
                heading.setDegrees(corrector.getHeading());
                pitch.setDegrees(corrector.getPitch());
                roll.setDegrees(corrector.getRoll());
                callback({
                    heading: heading.getRadians(),
                    pitch: pitch.getRadians(),
                    roll: roll.getRadians(),
                    accelx: a.x,
                    accely: a.y,
                    accelz: a.z,
                    original: o,
                });
            }
        }

        function checkOrientation(event) {
            corrector.setOrientation(event.alpha !== null && event);
            onChange();
        }

        function checkMotion(event) {
            if(event && event.accelerationIncludingGravity && event.accelerationIncludingGravity.x){
                corrector.setAcceleration(event.accelerationIncludingGravity);
            }
            else if(event && event.acceleration && event.acceleration.x){
                corrector.setAcceleration(event.acceleration);
            }

            onChange();
        }
        
        corrector.setAcceleration(LandscapeMotion.ZERO_VECTOR);
        corrector.setOrientation(LandscapeMotion.ZERO_EULER);

        window.addEventListener("deviceorientation", checkOrientation, bubbles);
        window.addEventListener("devicemotion", checkMotion, bubbles);
    }
}

function MotionInput(commands, socket){
    NetworkedInput.call(this, "motion", commands, socket, 1);
    var motionState = {
        buttons:[],
        axes:[],
        alt: false, ctrl: false, meta: false, shift: false
    }, 
        commandState = {}, i, n,
        BASE = ["heading", "pitch", "roll", "accelx", "accely", "accelz"]
        AXES = BASE.concat(BASE.map(function(v){return "d" + v;})).concat(BASE.map(function(v){return "l" + v;}));

    AXES.forEach(function(v, i){ motionState.axes[i] = 0; });

    LandscapeMotion.addEventListener("deviceorientation", function (evt) {
        this.inPhysicalUse = true;
        BASE.forEach(function(k){
            motionState.axes[BASE.indexOf(k)] = evt[k];
        });
    }.bind(this));
    
    function readMeta(event){
        META.forEach(function(m){
            motionState[m] = event[m + "Key"];
        });
    }

    window.addEventListener("keydown", readMeta, false);

    window.addEventListener("keyup", readMeta, false);

    this.update = function(){
        BASE.forEach(function(k){
            var l = AXES.indexOf("l" + k);
            var d = AXES.indexOf("d" + k);
            k = AXES.indexOf(k);
            if(motionState.axes[l]){
                motionState.axes[d] = motionState.axes[k] - motionState.axes[l];
            }
            motionState.axes[l] = motionState.axes[k];
        });
        this.checkDevice(motionState);
    };
}

inherit(MotionInput, NetworkedInput);