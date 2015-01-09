function bears(){
    var app = new VRApplication(
        // the name of the app, for connecting to a server.
        "bears", 
        // a COLLADA file specifying a model to use as the scene
        "models/scene.dae",
        // a COLLADA file specifying a model to use as instanceable button objects
        "models/button.dae", 
        // parameters for the buttons
        {
            maxThrow: 0.1,
            minDeflection: 10,
            colorUnpressed: 0x7f0000,
            colorPressed: 0x007f00,
            toggle: true
        },
        // a COLLADA file specifying a model to use as an avatar
        "models/bear.dae",
        // how tall the avatar is
        6.5, 
        // how fast the avatar moves
        15,
        // a UI interaction sound
        "music/click.mp3",
        // ambient background sound
        "music/ocean.mp3",
        // ambient background color
        {
            backgroundColor: 0xafbfff
        }
    );

    app.addEventListener("ready", function(){        
        // dynamically adding an object to the scene
        var a = axis(5, 0.125);
        a.position.set(0, 1, 0);
        app.scene.add(a);
        
        // altering an object in the scene
        var v = 0.55 * app.options.drawDistance;
        app.mainScene.Skybox.scale.set(v, v, v);
    });
    
    // dynamically animating an object in the scene
    var skyboxRotation = new THREE.Euler(0, 0, 0, "XYZ");
    app.addEventListener("update", function(){
        skyboxRotation.set(app.lt*0.00001, 0, 0, "XYZ");
        app.mainScene.Skybox.position.copy(app.currentUser.position);
        app.mainScene.Skybox.setRotationFromEuler(skyboxRotation);  
    });
    
    // adding custom commands to the app that weren't included in the base implementation
    app.keyboard.addCommand({ name: "jump", buttons: [KeyboardInput.SPACEBAR], commandDown: function (){
        if(this.onground){
            this.currentUser.velocity.y += 10;
            this.onground = false;
        }
    }.bind(app), dt: 0.5 });

    app.start();
}
