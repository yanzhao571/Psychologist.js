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

function setupOrientation(orient, move, rotate, orientName) {
    var ZERO_VECTOR = { x: 9.80665, y: 0, z: 0 }, ZERO_EULER = {gamma: 0, alpha: 0, beta: 0},
        acceleration = ZERO_VECTOR, rotation = ZERO_EULER, orientation = ZERO_EULER,
        beta = new Angle(0), gamma = new Angle(0), alpha = new Angle(0),
        belowHorizon, landscape, portrait, upsideDown, orientationName, origOrientName = orientName,
        omx, omy, omz, osx, osy, osz, da;

    if(!screen.hasOwnProperty("orientation")){
        screen.orientation = orientationName;
    }

    function checkOrientation(event) {
        orientation = event || ZERO_EULER;
        
        belowHorizon = portrait 
            ? (upsideDown ? (orientation.beta < 90) : (orientation.beta >= 90))
            : (upsideDown ? (orientation.gamma < 0) : (orientation.gamma > 0))
        
        if(landscape){
            if(upsideDown){
        console.log("Heyo");
                if(belowHorizon){
                    da = -90;
                }
                else{
                    da = 90;
                }
            }
            else{
                if(belowHorizon){
                    da = 90;
                }
                else{
                    da = -90;
                }
            }
            alpha.degrees = orientation.alpha + da;
        }
        else{
            alpha.degrees = orientation.alpha;
        }


        if(orient){
            //orient(orientation.gamma, orientation.beta, orientation.alpha);
            //orient(gamma.degrees, beta.degrees, alpha.degrees);
            orient(gamma.radians, beta.radians, alpha.radians);
        }
    }
    window.addEventListener("deviceorientation", checkOrientation, false);

    orientName = function(){
        landscape = screen.orientation && screen.orientation.indexOf("landscape") == 0;
        portrait = screen.orientation && screen.orientation.indexOf("portrait") == 0;
        upsideDown = screen.orientation && screen.orientation.indexOf("secondary") > 0;
        if(origOrientName){
            origOrientName();
        }
    };
    
    function checkMotion(event) {
        acceleration = (event && event.x && event.y && event.z && (event.accelerationIncludingGravity || event.acceleration)) || ZERO_VECTOR;
        rotation = (event && event.rotationRate) || ZERO_EULER;

        omx = Math.abs(acceleration.x);
        omy = Math.abs(acceleration.y);
        omz = Math.abs(acceleration.z);

        osx = acceleration.x / omx;
        osy = acceleration.y / omy;
        osz = acceleration.z / omz;  

        if(!isFirefox){
            if(omx > omy && omx > omz && (omx > 4.5 || orientationName == null)){
                orientationName = "landscape-" + (osx == 1 ? "secondary" : "primary");
            }
            else if(omy > omz && omy > omx && (omy > 4.5 || orientationName == null)){
                orientationName = "portrait-" + (osy == 1 ? "primary" : "secondary");
            }

            if(screen.orientation != orientationName){
                screen.orientation = orientationName;
                orientName();
            }
        }

        if(move){
            move(acceleration.x, acceleration.y, acceleration.z);
        }  
        if(rotate){
            rotate(rotation.gamma, rotation.beta, rotation.alpha);
        }
    }
    checkMotion();
    checkOrientation();
    window.addEventListener("devicemotion", checkMotion, false);

    if(isFirefox){
        screen.addEventListener("orientationchange", orientName);
    }
}

function motionTester(){
    var d = findEverything();
    with(d){
        b.innerHTML = isChrome ? "Chrome" : (isFirefox ? "Firefox" : "Other");
        setupOrientation(function(gamma, beta, alpha){
            og.innerHTML = gamma;
            ob.innerHTML = beta;
            oa.innerHTML = alpha;
        }, function(x, y, z){
            g.innerHTML = Math.sqrt(x*x + y*y + z*z);
            ax.innerHTML = x;
            ay.innerHTML = y;
            az.innerHTML = z;
        }, function(gamma, beta, alpha){
        }, function(){
            o.innerHTML = screen.orientation;
        });
    }
}