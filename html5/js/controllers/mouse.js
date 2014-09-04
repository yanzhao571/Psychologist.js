include(0,
    "js/psychologist.js",
    "js/input/NetworkedInput.js",
    "js/input/MouseInput.js",
    function () {
    "use strict";
    var output = document.getElementById("output"),
        frame = 0,
        buttons = ["fire", "alternate fire", "left+right", "middle", "right", "minus-left", "minus-middle", "minus-right", "horiz+vert"],
        axis = ["horiz", "minus-horiz", "vert", "minus-vert", "wheel", "minus-wheel", "horiz+vert"],
        mouse = new MouseInput([
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
            { name: "horiz", axes: [1] },
            { name: "minus-horiz", axes: [-1] },
            { name: "vert", axes: [2] },
            { name: "minus-vert", axes: [-2] },
            { name: "wheel", axes: [3] },
            { name: "minus-wheel", axes: [-3] },
            { name: "horiz+vert", axes: [1, 2] }
        ], document.documentElement);

    function loop(dt) {
        requestAnimationFrame(loop);
        mouse.update();
        output.innerHTML = "<ul>"
            + buttons.map(function (b) { return "<li>" + b + ": " + mouse.isDown(b) + "</li>"; }).join("")
            + axis.map(function (a) { return "<li>" +a + " -> " + mouse.getValue(a)+ "</li>"; }).join("")
            + "</ul>";
    }

    requestAnimationFrame(loop);
});