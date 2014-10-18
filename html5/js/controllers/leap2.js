include(0,
    ["lib/leap-0.6.3.min.js",
    "js/input/NetworkedInput.js",
    "js/input/ButtonAndAxisInput.js",
    "js/input/LeapMotionInput.js"],
function (){
    var c = findEverything(),
        buttons = [ { name: "OK", 
            x: -100, y: 100, z: 0, 
            w:  100, h: 100, d: 100 } ],
        axes = [],
        commands = [
            { name: "x", axes: [LeapMotionInput.FINGER0TIPX] },
            { name: "y", axes: [LeapMotionInput.FINGER0TIPY] },
            { name: "z", axes: [LeapMotionInput.FINGER0TIPZ] },
            { name: "jump", buttons: [1], commandUp: console.log.bind(console, "jump") }
        ],
        leap = new LeapMotionInput("hand", buttons, axes, commands),
        lt;
    
    leap.start(function(t){
        leap.update((t - lt) * 0.001);
        lt = t;
        c.output.innerHTML = "";
        commands.forEach(function(cmd){
            var d = document.createElement("div");
            d.appendChild(document.createTextNode(fmt(
                "$1 = $2",
                cmd.name,
                leap.getValue(cmd.name))));
            c.output.appendChild(d);
        });
    });
});