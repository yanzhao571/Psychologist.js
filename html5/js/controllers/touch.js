include(0,
    "js/psychologist.js",
    "js/input/NetworkedInput.js",
    "js/input/TouchInput.js",
    function mouseTest() {
    "use strict";
    var output = document.getElementById("output"),
        frame = 0,
        buttons = [
            {name: "fire", x: 100, y: 240, w: 100, h: 100 },
            {name: "jump", x: 100, y: 350, w: 100, h: 100 }
        ],
        axes = ["x0", "y0", "x1", "y1", "x2", "y2", "dx0"],
        touch = new TouchInput(3, buttons, [
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
            { name: "x0", axes: [1] },
            { name: "y0", axes: [2] },
            { name: "x1", axes: [3] },
            { name: "y1", axes: [4] },
            { name: "x2", axes: [5] },
            { name: "y2", axes: [6] },
            { name: "dx0", axes: [7] },
        ], null, document.documentElement);

        buttons.forEach(function(b){
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
        });
    function loop(dt) {
        requestAnimationFrame(loop);
        touch.update();
        output.innerHTML = "<ul>"
            + buttons.map(function (b) { return "<li>" + b.name + ": " + touch.isDown(b.name) + "</li>"; }).join("")
            + axes.map(function (a) { return "<li>" +a + " -> " + touch.getValue(a)+ "</li>"; }).join("")
            + "</ul>";
    }

    requestAnimationFrame(loop);
});