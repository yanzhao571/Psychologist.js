include(0,
    ["js/input/NetworkedInput.js",
    "js/input/ButtonAndAxisInput.js",
    "js/input/GamepadInput.js"],
    gamepadTest);
function gamepadTest(){
    "use strict";
    var output = document.getElementById("output"),
        commands = [
            { name: "lhoriz", axes: [GamepadInput.LSX] },
            { name: "lvert", axes: [GamepadInput.LSY] },
            { name: "ilhoriz", axes: [GamepadInput.ILSX] },
            { name: "ilvert", axes: [GamepadInput.ILSY] },
        ],
        gamepad = new GamepadInput("gamepad", commands);

    gamepad.addEventListener("gamepadconnected", function (id){
        gamepad.setGamepad(id);
        console.log("connected", id);
    });
    
    window.onunload = function(){
        gamepad.enable(false);
    };

    gamepad.addEventListener("gamepaddisconnected", console.log.bind(console, "disconnected"));
    var lt = 0;
    function loop(t){
        requestAnimationFrame(loop);
        gamepad.update((t - lt) * 0.001);
        lt = t;
        if(gamepad.isGamepadSet()){
            output.innerHTML = "<ul>"
            + commands.map(function (c){ 
                return "<li>" + c.name 
                    + ": " + gamepad.isDown(c.name) 
                    + ", " + gamepad.getValue(c.name) + "</li>"; 
            }).join("")
            + "</ul>";
        }
    }

    requestAnimationFrame(loop);
}