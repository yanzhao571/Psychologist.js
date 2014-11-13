function bears(){
    var app = new Application("bears", 
        "models/slots.dae",
        "models/button2.dae", {
            maxThrow: 0.1,
            minDeflection: 10,
            colorUnpressed: 0x7f0000,
            colorPressed: 0x007f00,
            toggle: true
        },
        "models/bear.dae",
        6.5, 
        15,
        "music/click.mp3",
        "music/ambient.mp3",{
            backgroundColor: 0xafbfff
        }
    );

    app.addEventListener("ready", function(){        
    });
    
    app.addEventListener("update", function(){
    });
    
    app.start();
}