function setupOrientation(func){
    function clamp360(v){
        while(v >= 360) v -= 360;
        while(v < 0) v += 360;
        return v;
    }

    window.addEventListener("deviceorientation", function(event) {
        var tiltDirection = Math.sign(event.gamma) * upDirection, offset = (1-tiltDirection)*90;        

        var gamma = clamp360(event.gamma + (1-tiltDirection)*90);        
        var beta = clamp360(upDirection * tiltDirection * event.beta + offset);        
        var alpha = clamp360(event.alpha - 90 * (2 + upDirection + tiltDirection));
        func(gamma, beta, alpha);
    }, true);

    window.addEventListener("devicemotion", function(event){
        var a = event.accelerationIncludingGravity || zeroVector;
        upDirection = Math.sign(a.x);
        upC = (1-upDirection)/2;
    }, true);
}