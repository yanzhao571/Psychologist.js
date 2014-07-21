function Angle(){    
    var value = 0,
        delta = 0,
        d1, d2, d3;
   
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

function setupOrientation(orient, move) {

    var ZERO_VECTOR = { x: 0, y: 0, z: 0 },
        beta = new Angle(), gamma = new Angle(), alpha = new Angle(),
        oriented = false, moved = false, calibrated = false;

    window.addEventListener("deviceorientation", function (event) {
        if(!calibrated){
            oriented = true;
            if(moved){
                calibrateToSensors();
            }
        }
        gamma.degrees = event.gamma;
        beta.degrees = event.beta;
        alpha.degrees = event.alpha;
        if(orient){
            orient(gamma.radians, beta.radians, alpha.radians);
        }
    }, false);

    window.addEventListener("devicemotion", function (event) {
        if(!calibrated){
            moved = true;
            if(oriented){
                calibrateToSensors();
            }
        }
        accel = event.accelerationIncludingGravity || ZERO_VECTOR;
        if(move){
            move(accel.x, accel.y, accel.z);
        }
    }, false);
}