include(0,
    ["js/input/ButtonAndAxisInput.js",
    "js/input/MotionInput.js"],
    motionTest);

function motionTest(){
    var output = document.getElementById("output"),
        zeroButton = document.getElementById("zeroButton"),
        commands = [
            {name: "heading", axes: [MotionInput.HEADING]},
            {name: "pitch", axes: [MotionInput.PITCH]},
            {name: "roll", axes: [MotionInput.ROLL]},
            {name: "x", axes: [MotionInput.ACCELX]},
            {name: "y", axes: [MotionInput.ACCELY]},
            {name: "z", axes: [MotionInput.ACCELZ]},
            {name: "alpha", axes: [MotionInput.ALPHA]},
            {name: "beta", axes: [MotionInput.BETA]},
            {name: "gamma", axes: [MotionInput.GAMMA]},
        ],
        motion = new MotionInput("motion", null, commands);

    zeroButton.addEventListener("click", motion.zeroAxes.bind(motion), false);

    var lt = 0;
    function loop(t){
        requestAnimationFrame(loop);
        motion.update((t - lt) * 0.001);
        lt = t;
        output.innerHTML = "";
            
        for(var i = 0; i < commands.length; ++i){
            var cmd = commands[i];
            var li = document.createElement("li");
            var v = motion.getValue(cmd.name);
            li.innerHTML = fmt("$1: $2.000", cmd.name, v);
            output.appendChild(li);
        }
    }
    
    requestAnimationFrame(loop);
}