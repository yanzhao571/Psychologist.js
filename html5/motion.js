function setupOrientation(func) {
    function clamp360(v) {
        while (v >= 360) v -= 360;
        while (v < 0) v += 360;
        return v;
    }

    var ZERO_VECTOR = { x: 0, y: 0, z: 0 },
        upDirection = null,
        RAD_PER_DEG = Math.PI / 180;

    window.addEventListener("deviceorientation", function (event) {
        var tiltDirection = Math.sign(event.gamma) * upDirection;

        var gamma = clamp360(tiltDirection * 90 - upDirection * event.gamma) * RAD_PER_DEG;
        var beta = clamp360(upDirection * tiltDirection * event.beta + (3 - tiltDirection) * 90) * RAD_PER_DEG;
        var alpha = clamp360(event.alpha - 90 * (2 + upDirection + tiltDirection)) * RAD_PER_DEG;
        func(gamma, beta, alpha);
    }, false);

    window.addEventListener("devicemotion", function (event) {
        var a = event.accelerationIncludingGravity || ZERO_VECTOR;
        upDirection = Math.sign(a.x);
    }, false);

    window.addEventListener("mousemove", function(event){
        var w2 = window.innerWidth / 2;
        var h2 = window.innerHeight / 2;
        var gamma = clamp360(Math.PI * (1.5 - event.clientY / window.innerHeight));
        var alpha = clamp360(-Math.PI * (1.5 + 2 * event.clientX / window.innerWidth));
        func(gamma, Math.PI / 2, alpha);
    }, false);
}