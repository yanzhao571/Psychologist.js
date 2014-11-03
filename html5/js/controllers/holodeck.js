function holodeck(){
    var ctrls = findEverything(),
        testPoint = new THREE.Vector3(),
        raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 7),
        direction = new THREE.Vector3(),
        autoWalking = false,
        onground = false,
        dt = 0,
        lt = 0,
        frame = 0,
        heading = 0,
        pointerHeading = 0,
        pitch = 0,
        roll = 0,
        strafe = 0,
        drive = 0,
        mainScene = null,
        factories = null,
        app = new Application("holodeck", {
            avatarModel: "models/bear.dae",
            clickSound: "music/click.mp3",
            ambientSound: "music/ambient.mp3"
        });

    function waitForResources(t){
        lt = t;
        if(app.camera && app.currentUser){
            app.leap.start();
            requestAnimationFrame(animate);
        }
        else{
            requestAnimationFrame(waitForResources);
        }
    }

    function animate(t){
        requestAnimationFrame(animate);
        dt = (t - lt) * 0.001;
        lt = t;

        if(app.wasFocused && app.focused){
            app.update(dt);

            roll = app.head.getValue("roll");
            pitch = app.head.getValue("pitch")
                + app.gamepad.getValue("pitch")
                + app.mouse.getValue("pitch");
            heading = app.head.getValue("heading") 
                + app.gamepad.getValue("heading")
                + app.touch.getValue("heading")
                + app.mouse.getValue("heading");

            pointerHeading = heading + app.mouse.getValue("pointerHeading");

            if(ctrls.defaultDisplay.checked){
                //
                // update user position and view
                //

                app.currentUser.dHeading = (heading - app.currentUser.heading) / dt;
                strafe = app.keyboard.getValue("strafeRight")
                    + app.keyboard.getValue("strafeLeft")
                    + app.gamepad.getValue("strafe");
                drive = app.keyboard.getValue("driveBack")
                    + app.keyboard.getValue("driveForward")
                    + app.gamepad.getValue("drive")
                    + app.touch.getValue("drive");

                if(onground || app.currentUser.position.y < -0.5){                
                    if(autoWalking){
                        strafe = 0;
                        drive = -0.5;
                    }
                    if(strafe || drive){
                        len = SPEED * Math.min(1, 1 / Math.sqrt(drive * drive + strafe * strafe));
                    }
                    else{
                        len = 0;
                    }

                    strafe *= len;
                    drive *= len;
                    len = strafe * Math.cos(pointerHeading) + drive * Math.sin(pointerHeading);
                    drive = drive * Math.cos(pointerHeading) - strafe * Math.sin(pointerHeading);
                    strafe = len;
                    app.currentUser.velocity.x = app.currentUser.velocity.x * 0.9 + strafe * 0.1;
                    app.currentUser.velocity.z = app.currentUser.velocity.z * 0.9 + drive * 0.1;
                }

                app.currentUser.velocity.y -= dt * GRAVITY;

                //
                // do collision detection
                //
                var len = app.currentUser.velocity.length() * dt;
                direction.copy(app.currentUser.velocity);
                direction.normalize();
                testPoint.copy(app.currentUser.position);
                testPoint.y += PLAYER_HEIGHT / 2;
                raycaster.set(testPoint, direction);
                raycaster.far = len;
                intersections = raycaster.intersectObject(app.scene, true);
                for(var i = 0; i < intersections.length; ++i){
                    var inter = intersections[i];
                    if(inter.object.parent.isSolid){
                        testPoint.copy(inter.face.normal);
                        testPoint.applyEuler(inter.object.parent.rotation);
                        app.currentUser.velocity.reflect(testPoint);
                        var d = testPoint.dot(app.camera.up);
                        if(d > 0.75){
                            app.currentUser.position.y = inter.point.y + 0.0125;
                            app.currentUser.velocity.y = 0.1;
                            onground = true;
                        }
                    }
                }

                // ground test
                testPoint.copy(app.currentUser.position);
                var GROUND_TEST_HEIGHT = 3;
                testPoint.y += GROUND_TEST_HEIGHT;
                direction.set(0, -1, 0);
                raycaster.set(testPoint, direction);
                raycaster.far = GROUND_TEST_HEIGHT * 2;
                intersections = raycaster.intersectObject(app.scene, true);
                for(var i = 0; i < intersections.length; ++i){
                    var inter = intersections[i];
                    if(inter.object.parent.isSolid){
                        testPoint.copy(inter.face.normal);
                        testPoint.applyEuler(inter.object.parent.rotation);
                        app.currentUser.position.y = inter.point.y;
                        app.currentUser.velocity.y = 0;
                        onground = true;
                    }
                }

                //
                // send a network update of the user's position, if it's been enough 
                // time since the last update (don'dt want to flood the server).
                //
                frame += dt;
                if(frame > DFRAME){
                    frame -= DFRAME;
                    var state = {
                        x: app.currentUser.position.x,
                        y: app.currentUser.position.y,
                        z: app.currentUser.position.z,
                        dx: app.currentUser.velocity.x,
                        dy: app.currentUser.velocity.y,
                        dz: app.currentUser.velocity.z,
                        heading: app.currentUser.heading,
                        dHeading: (app.currentUser.heading - app.currentUser.lastHeading) / DFRAME,
                        isRunning: app.currentUser.velocity.length() > 0
                    };
                    app.currentUser.lastHeading = app.currentUser.heading;
                    if(app.socket){
                        app.socket.emit("userState", state);
                    }
                }
            }

            //
            // update avatars
            //
            for(var key in app.users){
                var user = app.users[key];
                testPoint.copy(user.velocity);
                testPoint.multiplyScalar(dt);
                user.position.add(testPoint);
                user.heading += user.dHeading * dt;
                user.rotation.set(0, user.heading, 0, "XYZ");
                if(user !== app.currentUser){ 
                    // we have to offset the rotation of the name so the user
                    // can read it.
                    user.nameObj.rotation.set(0, app.currentUser.heading - user.heading, 0, "XYZ");
                }
                if(!user.animation.isPlaying && user.velocity.length() >= 2){
                    user.animation.play();                
                }
                else if(user.animation.isPlaying && user.velocity.length() < 2){
                    user.animation.stop();
                }
            }

            //
            // place pointer
            //
            var pointerDistance = app.leap.getValue("HAND0Z") 
                + app.mouse.getValue("pointerDistance")
                + 2;
            var dp = pitch 
                    + app.mouse.getValue("pointerPitch") 
                    + app.mouse.getValue("pointerPress");
            pointerDistance /= Math.cos(dp);
            direction.set(0, 0, -pointerDistance)
                .applyAxisAngle(RIGHT, -dp)
                .applyAxisAngle(app.camera.up, pointerHeading);


            app.hand.position.copy(app.camera.position)
                .add(direction);

            for(var j = 0; j < mainScene.buttons.length; ++j){
                var tag = mainScene.buttons[j].test(app.camera.position, app.hand.position);
                if(tag){
                    app.hand.position.copy(tag);
                }
            }

            app.render(pitch, heading, roll, app.currentUser);
        }

        app.wasFocused = app.focused;
    }

    ModelLoader.loadCollada("models/scene2.dae", function(object){
        mainScene = object;
        app.scene.add(object);
        var cam = mainScene.Camera.children[0];
        app.camera = new THREE.PerspectiveCamera(cam.fov, cam.aspect, cam.near, DRAW_DISTANCE);
        var buttonFactory1 = new VUI.ButtonFactory(
                mainScene, 
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
        });
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

    requestAnimationFrame(waitForResources);
}