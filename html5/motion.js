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

function setupOrientation(orient, move) {

    var ZERO_VECTOR = { x: 0, y: 0, z: 0 },
        upDirection = null,
        RAD_PER_DEG = Math.PI / 180,
        gamma = new Angle(), beta = new Angle(), alpha = new Angle(),
        tiltDirection, accel;

    window.addEventListener("deviceorientation", function (event) {
        tiltDirection = Math.sign(event.gamma) * upDirection;

        gamma.degrees = tiltDirection * 90 - upDirection * event.gamma;
        beta.degrees = upDirection * tiltDirection * event.beta + (3 - tiltDirection) * 90;
        alpha.degrees = event.alpha - 90 * (2 + upDirection + tiltDirection);
        if(orient){
            orient(gamma.radians, beta.radians, alpha.radians);
        }
    }, false);

    window.addEventListener("devicemotion", function (event) {
        accel = event.accelerationIncludingGravity || ZERO_VECTOR;
        upDirection = Math.sign(accel.x);
        if(move){
            move(accel.x, accel.y, accel.z);
        }
    }, false);

    window.addEventListener("mousemove", function(event){
        gamma.degrees = 180 * (1.5 - event.clientY / window.innerHeight);
        alpha.degrees = -180 * (1.5 + 2 * event.clientX / window.innerWidth);
        if(orient){
            orient(gamma.radians, Math.PI / 2, alpha.radians);
        }
    }, false);
}