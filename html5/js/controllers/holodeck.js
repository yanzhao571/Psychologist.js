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
        var COUNT = 5;
        for(var i = -COUNT; i <= COUNT; ++i){
            var btn = app.makeButton((i+COUNT)%2);
            var angle = Math.PI * i * 10 / 180;
            var r = 10;
            btn.position.set(Math.cos(angle) * r, Math.cos(i * Math.PI) * 0.25, Math.sin(-angle) * r);
            btn.rotation.set(0, angle - Math.PI, 0, "XYZ");
            btn.addEventListener("click", function(n){
                app.audio.sawtooth(40 - n * 5, 0.1, 0.25);
            }.bind(this, i));
            app.scene.add(btn.base);
        }
        
        var obj = axis(5, 0.125);

        obj.position.set(0, 1, 0);
        app.scene.add(obj);
    });
    
    app.keyboard.addCommand({ name: "jump", buttons: [KeyboardInput.SPACEBAR], commandDown: function (){
        if(this.onground){
            this.currentUser.velocity.y += 10;
            this.onground = false;
        }
    }.bind(app), dt: 0.5 });

    app.start();
}