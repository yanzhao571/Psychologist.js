function mouseTest() {
    "use strict";
    var output = document.getElementById("output"),
        frame = 0,
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

    var buttons = ["fire", "alternate fire", "left+right", "middle", "right", "minus-left", "minus-middle", "minus-right", "horiz+vert"];
    var axis = ["horiz", "minus-horiz", "vert", "minus-vert", "wheel", "minus-wheel", "horiz+vert"];

    function loop(dt) {
        requestAnimationFrame(loop);
        mouse.update();
        output.innerHTML = "<ul><li>"
            + buttons.map(function (b) { return b + ": " + mouse.isDown(b); }).join("</li><li>")
            + "</li><li>"
            + axis.map(function (a) { return a + " -> " + mouse.getValue(a); }).join("</li><li>")
            + "</li></ul></p>";
    }

    requestAnimationFrame(loop);
}