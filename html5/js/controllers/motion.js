function motionTester() {
    var output = document.getElementById("output");
    var arr = [
        "heading",
        "pitch",
        "roll",
        "original.orientation.alpha",
        "original.orientation.gamma",
        "original.orientation.beta",
        "original.acceleration.x",
        "original.acceleration.y",
        "original.acceleration.z"
    ];

    LandscapeMotion.addEventListener("deviceorientation", function (evt) {
        var val = "";
        arr.forEach(function (key) {
            var obj = evt;
            var parts = key.split(".");
            parts.forEach(function(p){
                if (obj.hasOwnProperty(p)) {
                    obj = obj[p];
                }
            });
            val += fmt("<li>$1: $2.000</li>", key, obj);
        });
        output.innerHTML = val;
    }, false);
}