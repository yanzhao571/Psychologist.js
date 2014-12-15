function bears(){
    var app = new VRApplication("bears", 
        "models/scene.dae",
        "models/button.dae", {
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
        "music/ocean.mp3",{
            backgroundColor: 0xafbfff
        }
    );

    app.addEventListener("ready", function(){        
        var a = axis(5, 0.125);
        a.position.set(0, 1, 0);
        app.scene.add(a);
        var v = 0.55 * app.options.drawDistance;
        app.mainScene.Skybox.scale.set(v, v, v);
    });
    
    var skyboxRotation = new THREE.Euler(0, 0, 0, "XYZ");
    app.addEventListener("update", function(){
        skyboxRotation.set(app.lt*0.00001, 0, 0, "XYZ");
        app.mainScene.Skybox.position.copy(app.currentUser.position);
        app.mainScene.Skybox.setRotationFromEuler(skyboxRotation);  
    });
    
    app.keyboard.addCommand({ name: "jump", buttons: [KeyboardInput.SPACEBAR], commandDown: function (){
        if(this.onground){
            this.currentUser.velocity.y += 10;
            this.onground = false;
        }
    }.bind(app), dt: 0.5 });

    app.start();
}