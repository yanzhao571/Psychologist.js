include(0,
    ["js/psychologist.js",
    "js/input/NetworkedInput.js",
    "js/input/TouchInput.js"],
    touchTest);
function touchTest() {
    "use strict";
    var output = document.getElementById("output"),
        frame = 0,
        buttons = [
            {name: "fire", x: 100, y: 240, w: 100, h: 100 },
            {name: "jump", x: 100, y: 350, w: 100, h: 100 }
        ],
        commands = [
            { name: "fire", buttons: [1], commandDown: function(){
                document.getElementById("fire").style.backgroundColor = "blue";
            }, commandUp: function(){
                document.getElementById("fire").style.backgroundColor = "#c0c0c0";
            }, dt: 250 },
            { name: "jump", buttons: [2], commandDown: function(){
                document.getElementById("jump").style.backgroundColor = "blue";
            }, commandUp: function(){
                document.getElementById("jump").style.backgroundColor = "#c0c0c0";
            }, dt: 250 },
            { name: "x0", axes: [TouchInput.X0] },
            { name: "y0", axes: [TouchInput.Y0] },
            { name: "x1", axes: [TouchInput.X1] },
            { name: "y1", axes: [TouchInput.Y1] },
            { name: "x2", axes: [TouchInput.X2] },
            { name: "y2", axes: [TouchInput.Y2] },
            { name: "dx0", axes: [TouchInput.DX0] },
            { name: "iy1", axes: [TouchInput.IY1] },
        ],
        touch = new TouchInput(buttons, commands, null, document.documentElement);

    for(var i = 0; i < buttons.length; ++i) {
        var b = buttons[i];
        var d = document.createElement("div");
        d.style.position = "absolute";
        d.style.left = px(b.x);
        d.style.top = px(b.y);
        d.style.width = px(b.w);
        d.style.height = px(b.h);
        d.style.background = "#c0c0c0";
        d.innerHTML = b.name;
        d.id = b.name;
        document.body.appendChild(d);
    }
    function loop(dt) {
        requestAnimationFrame(loop);
        touch.update(dt);
        output.innerHTML = "<ul>"
            + commands.map(function (c) { return "<li>" + c.name + ": " + touch.isDown(c.name) + ", " + touch.getValue(c.name) + "</li>"; }).join("")
            + "</ul>";
    }

    requestAnimationFrame(loop);
}