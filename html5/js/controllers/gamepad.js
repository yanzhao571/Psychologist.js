include(0,
    ["js/psychologist.js",
    "js/input/NetworkedInput.js",
    "js/input/GamepadInput.js"],
    gamepadTest);
function gamepadTest() {
    "use strict";
    var output = document.getElementById("output"),
        frame = 0,
        commands = [
            { name: "a", buttons: [1] },
            { name: "b", buttons: [2] },
            { name: "x", buttons: [3] },
            { name: "y", buttons: [4] },
            { name: "lb", buttons: [5] },
            { name: "rb", buttons: [6] },
            { name: "lt", buttons: [7] },
            { name: "rt", buttons: [8] },
            { name: "select", buttons: [9] },
            { name: "start", buttons: [10] },
            { name: "ls", buttons: [11] },
            { name: "rs", buttons: [12] },
            { name: "du", buttons: [13] },
            { name: "dd", buttons: [14] },
            { name: "dl", buttons: [15] },
            { name: "dr", buttons: [16] },
            { name: "lhoriz", axes: [GamepadInput.LSX] },
            { name: "lvert", axes: [GamepadInput.LSY] },
            { name: "rhoriz", axes: [GamepadInput.RSX] },
            { name: "rvert", axes: [GamepadInput.RSY] },
            { name: "ilhoriz", axes: [GamepadInput.ILSX] },
            { name: "ilvert", axes: [GamepadInput.ILSY] },
            { name: "irhoriz", axes: [GamepadInput.IRSX] },
            { name: "irvert", axes: [GamepadInput.IRSY] }
        ],
        gamepad = new GamepadInput(null, commands);

    function jump(id) {
        console.log(id, "jumped");
    }

    function fire(id) {
        console.log(id, "fired");
    }

    gamepad.addEventListener("gamepadconnected", function (id) {
        //if (confirm(id)) {
            gamepad.setGamepad(id);
            console.log("connected", id);
        //}
    });

    gamepad.addEventListener("gamepaddisconnected", console.log.bind(console, "disconnected"));
    var lt = 0;
    function loop(t) {
        requestAnimationFrame(loop);
        gamepad.update((t - lt) * 0.001);
        lt = t;
        if(gamepad.isGamepadSet()){
            output.innerHTML = "<ul>"
            + commands.map(function (c) { return "<li>" + c.name + ": " + gamepad.isDown(c.name) + ", " + gamepad.getValue(c.name) + "</li>"; }).join("")
            + "</ul>";
        }
    }

    requestAnimationFrame(loop);
}