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
    
    var TONE_COUNT = 10;
    var NOTE_COUNT = 8;
    var CUBE_SIZE = 1;
    var cubes = [];
    for(var y = 0; y < NOTE_COUNT; ++y){
        cubes[y] = [];
        for(var x = 0; x < TONE_COUNT; ++x){
            cubes[y][x] = box(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE, 0xffffff);
        }
    }
    
    app.addEventListener("ready", function(){
        this.currentUser.position.z += -19;
        // add a bunch of buttons to the scene that we can play with
        for(var x = 0; x < TONE_COUNT; ++x){
            // I want some to be momentary and some to be toggle.
            var btn = this.makeButton((x+TONE_COUNT)%2);
            this.scene.add(btn.base);
            
            // Let's place the buttons in an arc, with a stagger of height
            // to make a sort of keyboard
            var angle = Math.PI * (x - TONE_COUNT / 2) * 10 / 180 + Math.PI;
            var r = 10;
            btn.position.set(Math.sin(angle) * r, Math.cos(x * Math.PI) * 0.25, Math.cos(angle) * r + 16);
            btn.rotation.set(0, angle+Math.PI/2, 0, "XYZ");
            
            // And let's play notes in a pentatonic scale!
            btn.addEventListener("click", function(n){
                this.audio.sawtooth(40 - n * 5, 0.1, 0.25);
            }.bind(this, x));
            
            // now, let's make a visualizer.
            for(var y = 0; y < NOTE_COUNT; ++y){
                var b = cubes[y][x];
                b.position.set(2 * CUBE_SIZE * (x - TONE_COUNT / 2), (y + 3) * 2 * CUBE_SIZE, -12);
                this.scene.add(b);
            }
        }
    }.bind(app));

    app.start();
}