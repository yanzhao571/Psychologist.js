include(0,
    ["js/psychologist.js",
     "js/input/NetworkedInput.js",
     "js/input/MouseInput.js"],
	postScriptLoad);

function postScriptLoad() {
    var output = document.getElementById("output"),
        frame = 0,
        commands = [
            { name: "fire", buttons: [1], meta: [-1], commandDown: console.log.bind(console, "Fire"), dt: 250 },
            { name: "alternate fire", buttons: [1], meta: [1], commandDown: console.log.bind(console, "Alternate fire"), dt: 250 },
            { name: "middle", buttons: [2], commandUp: function () {
                    if (mouse.isPointerLocked()) {
                        mouse.exitPointerLock();
                    }
                    else {
                        mouse.requestPointerLock();
                    }
                }
            },
            { name: "right", buttons: [3] },
            { name: "left+right", buttons: [1, 3] },
            { name: "minus-left", buttons: [-1] },
            { name: "minus-middle", buttons: [-2] },
            { name: "minus-right", buttons: [-3] },
            { name: "horiz", axes: [MouseInput.X] },
            { name: "minus-horiz", axes: [-MouseInput.X] },
            { name: "vert", axes: [MouseInput.Y] },
            { name: "minus-vert", axes: [-MouseInput.Y] },
            { name: "wheel", axes: [MouseInput.Z] },
            { name: "minus-wheel", axes: [-MouseInput.Z] },
            { name: "dwheel", axes: [MouseInput.DZ] },
            { name: "iwheel", axes: [MouseInput.IZ] },
            { name: "horiz+vert", axes: [MouseInput.X, MouseInput.Y] },
            { name: "dx", axes: [MouseInput.DX] },
            { name: "ix", axes: [MouseInput.IX] }
        ],
        mouse = new MouseInput([
            {axis: MouseInput.IX, min: -1, max: 1 }
        ], commands);

    var lt = 0;
    function loop(t) {
        requestAnimationFrame(loop);
        mouse.update((t - lt) * 0.001);
        output.innerHTML = "<ul>"
            + commands.map(function (c) { return "<li>" + c.name + ": " + mouse.isDown(c.name) + ", " + mouse.getValue(c.name) + "</li>"; }).join("")
            + "</ul>";
        lt = t;
    }

    requestAnimationFrame(loop);
}