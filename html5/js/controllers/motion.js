include(0,
    "js/psychologist.js",
    "js/input/MotionInput.js",
//    "test/MotionInput.js",
    function() {
        var output = document.getElementById("output"),
            commands = [
                {name: "heading", axes: [7]},
                {name: "pitch", axes: [8]},
                {name: "roll", axes: [9]},
                {name: "accelx", axes: [10]},
                {name: "accely", axes: [11]},
                {name: "accelz", axes: [12]}
            ],
            motion = new MotionInput(commands);

        LandscapeMotion.addEventListener("deviceorientation", function (evt) {
            output.innerHTML = "";
            commands.forEach(function (cmd) {
                var li = document.createElement("li");
                li.innerHTML = fmt("$1: $2.000", cmd.name, motion.getValue(cmd.name));
                output.appendChild(li);
            });
        }, false);

        setInterval(motion.update.bind(motion), 1);
    }
);