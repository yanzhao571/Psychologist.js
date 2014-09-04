include(0,
    "js/psychologist.js",
    "js/input/NetworkedInput.js",
    "js/input/MotionInput.js",
//    "test/MotionInput.js",
    function() {
        var output = document.getElementById("output"),
            commands = [
                {name: "heading", axes: [1]},
                {name: "pitch", axes: [2]},
                {name: "roll", axes: [3]},
                {name: "dheading", axes: [7]},
                {name: "dpitch", axes: [8]},
                {name: "droll", axes: [9]},
            ],
            h, p, r,
            motion = new MotionInput(commands);
        setInterval(function(){
            motion.update();
            if(!h){
                h = motion.getValue("heading");
                p = motion.getValue("pitch");
                r = motion.getValue("roll");
            }
            else{
                h += motion.getValue("dheading");
                p += motion.getValue("dpitch");
                r += motion.getValue("droll");
            }
            var arr = [h, p, r];
            output.innerHTML = "";
            commands.forEach(function (cmd, i) {
                var li = document.createElement("li");
                var v = motion.getValue(cmd.name);
                if(i < 3){
                    li.innerHTML = fmt("$1: $2.000, $3.000 ($4)", cmd.name, v, arr[i], v - arr[i]);
                }
                else{
                    li.innerHTML = fmt("$1: $2.000", cmd.name, v);
                }
                output.appendChild(li);
            });
        }, 16);
    }
);