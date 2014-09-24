include(0,
    ["js/psychologist.js",
    "js/input/NetworkedInput.js",
    "js/input/MotionInput.js"],
    motionTest);

function motionTest() {
    var output = document.getElementById("output"),
        commands = [
            {name: "heading", axes: [MotionInput.HEADING]},
            {name: "pitch", axes: [MotionInput.PITCH]},
            {name: "roll", axes: [MotionInput.ROLL]},
            {name: "x", axes: [MotionInput.ACCELX]},
            {name: "y", axes: [MotionInput.ACCELY]},
            {name: "z", axes: [MotionInput.ACCELZ]},
            {name: "dheading", axes: [MotionInput.DHEADING]},
            {name: "dpitch", axes: [MotionInput.DPITCH]},
            {name: "droll", axes: [MotionInput.DROLL]},
            {name: "iheading", axes: [MotionInput.IHEADING]},
            {name: "ipitch", axes: [MotionInput.IPITCH]},
            {name: "iroll", axes: [MotionInput.IROLL]},
        ],
        motion = new MotionInput(commands);

    function loop(dt){
        requestAnimationFrame(loop);
        motion.update(dt);
        output.innerHTML = "";
            
        for(var i = 0; i < commands.length; ++i) {
            var cmd = commands[i];
            var li = document.createElement("li");
            var v = motion.getValue(cmd.name);
            li.innerHTML = fmt("$1: $2.000", cmd.name, v);
            output.appendChild(li);
        }
    }
    
    requestAnimationFrame(loop);
}