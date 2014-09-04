include(0,
    "js/psychologist.js",
    "js/input/NetworkedInput.js",
    "js/input/GamepadInput.js",
    function () {
    "use strict";
    var output = document.getElementById("output"),
        frame = 0,
        buttons = ["a", "b", "x", "y", "lb", "rb", "lt", "rt", "dl", "dd", "dr", "du", "select", "start", "ls", "rs"],
        axis = ["lvert", "lhoriz", "rvert", "rhoriz"],
        gamepad = new GamepadInput([
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
            { name: "lhoriz", axes: [1] },
            { name: "lvert", axes: [2] },
            { name: "rhoriz", axes: [3] },
            { name: "rvert", axes: [4] }
        ]);

    function jump(id) {
        console.log(id, "jumped");
    }

    function fire(id) {
        console.log(id, "fired");
    }

    gamepad.addEventListener("gamepadconnected", function (id) {
        if (confirm(id)) {
            gamepad.setGamepad(id);
            console.log("connected", id);
        }
    });
    gamepad.addEventListener("gamepaddisconnected", console.log.bind(console, "disconnected"));

    function loop(dt) {
        requestAnimationFrame(loop);
        gamepad.update();
        if(gamepad.isGamepadSet()){
            output.innerHTML = "<ul><li>"
                + buttons.map(function(b){ return b + ": " + gamepad.isDown(b) + " -> " + gamepad.getValue(b); }).join("</li><li>")
                + "</li><li>"
                + axis.map(function(a){ return a + " -> " + gamepad.getValue(a); }).join("</li><li>")
                + "</li></ul>";
        }
    }

    requestAnimationFrame(loop);
});