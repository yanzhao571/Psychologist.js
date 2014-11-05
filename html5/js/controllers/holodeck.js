function holodeck(){
    window.app = new Application("holodeck", 
        "models/scene2.dae",
        "models/button2.dae", {
            maxThrow: 0.1,
            minDeflection: 10,
            colorUnpressed: 0x7f0000,
            colorPressed: 0x007f00
        },
        "models/bear.dae",
        6.5, 
        15,
        "music/click.mp3",
        "music/ambient.mp3"
    );
    
    app.addEventListener("ready", function(){
        // add a bunch of buttons to the scene that we can play with
        var COUNT = 5;
        for(var i = -COUNT; i <= COUNT; ++i){
            // I want some to be momentary and some to be toggle.
            var btn = this.makeButton((i+COUNT)%2);
            this.scene.add(btn.base);
            
            // Let's place the buttons in an arc, with a stagger of height
            // to make a sort of keyboard
            var angle = Math.PI * i * 10 / 180;
            var r = 10;
            btn.position.set(Math.cos(angle) * r, Math.cos(i * Math.PI) * 0.25, Math.sin(-angle) * r);
            btn.rotation.set(0, angle - Math.PI, 0, "XYZ");
            
            // And let's play notes in a pentatonic scale!
            btn.addEventListener("click", function(n){
                this.audio.sawtooth(40 - n * 5, 0.1, 0.25);
            }.bind(this, i));
        }
    }.bind(app));

    app.start();
}