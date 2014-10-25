include(0,
    ["js/input/NetworkedInput.js",
    "js/input/ButtonAndAxisInput.js",
    "js/input/MotionInput.js"],
    motionTest);

function motionTest(){
    var output = document.getElementById("output"),
        zeroButton = document.getElementById("zeroButton"),
        commands = MotionInput.AXES.map(function(name){
            return {name: name, axes: [MotionInput[name]] };
        }).concat(MotionInput.AXES.map(function(name){
            return {name: "I" + name, axes: [MotionInput["I" + name]] };
        })),
        motion = new MotionInput("motion", commands);

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