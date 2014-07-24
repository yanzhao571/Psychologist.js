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
    var ZERO_VECTOR = { x: 9.80665, y: 0, z: 0 }, ZERO_EULER = {gamma: 0, alpha: 0, beta: 0}, ZERO_COORD = {latitude: 0, longitude: 0, altitude: null, accuracy:Number.MAX_VALUE, altitudeAccuracy: null, heading: null, speed: null},
        acceleration = ZERO_VECTOR, rotation = ZERO_EULER, orientation = ZERO_EULER, location = ZERO_COORD,
        beta = new Angle(0), gamma = new Angle(0), alpha = new Angle(0),
        belowHorizon, landscape, portrait, upsideDown, orientationName,
        omx, omy, omz, osx, osy, osz, da, db, sb;

    if(!screen.hasOwnProperty("orientation")){
        screen.orientation = orientationName;
    }

    function onChange(){
        landscape = screen.orientation && screen.orientation.indexOf("landscape") == 0;
        portrait = screen.orientation && screen.orientation.indexOf("portrait") == 0;
        upsideDown = screen.orientation && screen.orientation.indexOf("secondary") > 0;
        if(callback){
            callback({
                orientation: screen.orientation,
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
                rotationAlpha: rotation.alpha,
                locationAccuracy: location.accuracy,
                locationLatitude: location.latitude,
                locationLongitude: location.longitude,
                locationHeading: location.heading,
                locationSpeed: location.speed,
                locationAltitude: location.altitude,
                locationAltitudeAccuracy: location.altitudeAccuracy
            });
        }
    }

    function checkOrientation(event) {        
        if(landscape){
            orientation = event || ZERO_EULER;
        
            belowHorizon = portrait
                ? (upsideDown ? (orientation.beta >= 90) : (orientation.beta < 90))
                : (upsideDown ? (orientation.gamma < 0) : (orientation.gamma > 0))
            if(upsideDown){
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
                sb = 1;
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
            }
            else{
                db = 180;
            }
            alpha.degrees = orientation.alpha + da;
            beta.degrees = sb * orientation.beta + db;
            onChange();
        }
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

        if(!isFirefox){
            if(omx > omy && omx > omz && (omx > 4.5 || orientationName == null)){
                orientationName = "landscape-" + (osx == 1 ? "secondary" : "primary");
            }
            else if(omy > omz && omy > omx && (omy > 4.5 || orientationName == null)){
                orientationName = "portrait-" + (osy == 1 ? "primary" : "secondary");
            }

            if(screen.orientation != orientationName){
                screen.orientation = orientationName;
            }
        }

        onChange();
    }
    window.addEventListener("devicemotion", checkMotion, false);

    if(isFirefox){
        screen.addEventListener("orientationchange", onChange);
    }

    if(navigator.hasOwnProperty("geolocation")){
        navigator.geolocation.watchPosition(function(event){
            console.log(event);
            location = event.coords;
        }, null, {
            enableHighAccuracy: true,
        });
    }

    checkMotion();
    checkOrientation();
}