function holodeck(){
    var factories = null,
        app = new Application("holodeck", {
            clickSound: "music/click.mp3",
            ambientSound: "music/ambient.mp3",
            sceneModel: "models/scene2.dae",
            avatarModel: "models/bear.dae",
            avatarHeight: 6.5,
            walkSpeed: 15
        });

    app.addEventListener("ready", function(){
        var buttonFactory1 = new VUI.ButtonFactory(
            app.mainScene, 
            "models/button2.dae", {
                maxThrow: 0.1,
                minDeflection: 10,
                colorUnpressed: 0x7f0000,
                colorPressed: 0x007f00,
                toggle: true
            },
            function(){
                var COUNT = 5;
                var buttonFactory2 = buttonFactory1.clone({
                    toggle: false
                });
                factories = [buttonFactory1, buttonFactory2];
                for(var i = -COUNT; i <= COUNT; ++i){
                    var btn = factories[(i+COUNT)%2].create();
                    var angle = Math.PI * i * 10 / 180;
                    var r = 10;
                    btn.position.set(Math.cos(angle) * r, Math.cos(i * Math.PI) * 0.25, Math.sin(-angle) * r);
                    btn.rotation.set(0, angle - Math.PI, 0, "XYZ");
                    btn.addEventListener("click", function(n){
                        app.audio.sawtooth(40 - n * 5, 0.1, 0.25);
                    }.bind(this, i));
                    app.scene.add(btn.base);
                }
                var obj = obj3(box(5, 0.125, 0.125, 0xff0000),
                    box(0.125, 0.125, 5, 0x00ff00),
                    box(0.125, 5, 0.125, 0x0000ff)
                );

                obj.position.set(0, 1, 0);

                app.scene.add(obj);
            }
        );
    });

    function obj3(){
        var obj = new THREE.Object3D();
        for(var i = 0; i < arguments.length; ++i){
            obj.add(arguments[i]);
        }
        return obj;
    }

    function box(x, y, z, c){
        var geom = new THREE.BoxGeometry(x, y, z);
        var mat = new THREE.MeshBasicMaterial({ color: c });
        var mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x / 2, y / 2, z / 2);
        return mesh;
    }

    app.start();
}