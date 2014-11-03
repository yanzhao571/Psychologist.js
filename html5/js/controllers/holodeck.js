function holodeck(){
    var ctrls = findEverything(),
        DRAW_DISTANCE = 500,
        CHAT_TEXT_SIZE = 0.25,
        RIGHT = new THREE.Vector3(-1, 0, 0),
        GRAVITY = 9.8, 
        SPEED = 15,
        DFRAME = 0.125,
        DEFAULT_USER_NAME = "CURRENT_USER_OFFLINE",
        userName = DEFAULT_USER_NAME,
        testPoint = new THREE.Vector3(),
        raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 7),
        direction = new THREE.Vector3(),
        focused = true,
        wasFocused = false,
        autoWalking = false,
        onground = false,
        startHeading = 0,
        dt = 0,
        lt = 0,
        frame = 0,
        heading = 0,
        pointerHeading = 0,
        pitch = 0,
        roll = 0,
        strafe = 0,
        drive = 0,
        chatLines = [],
        users = {},
        socket = null,
        lastText = null,
        lastNote = null,
        lastRenderingType = null,
        currentUser = null,
        clickSound = null,
        proxy = null,
        mainScene = null,
        factories = null,
        app = null;

    if(ctrls.appCacheReload.style.display === "none" && navigator.onLine){
        ctrls.loginForm.style.display = "";
        
        socket = io.connect(document.location.hostname, {
            "reconnect": true,
            "reconnection delay": 1000,
            "max reconnection attempts": 60
        });
        socket.on("typing", showTyping.bind(window, false, false));
        socket.on("chat", showChat);    
        socket.on("userJoin", addUser);
        socket.on("userState", updateUserState.bind(window, false));
        socket.on("userLeft", userLeft);
        socket.on("loginFailed", loginFailed);
        socket.on("userList", listUsers);
        socket.on("disconnect", msg.bind(window));
        socket.on("handshakeFailed", console.error.bind(console, "Failed to connect to websocket server. Available socket controllers are:"));
        socket.on("handshakeComplete", function(controller){
            if(controller === "demo"
                && ctrls.autoLogin.checked
                && ctrls.userNameField.value.length > 0
                && ctrls.passwordField.value.length > 0){
                ctrls.connectButton.click();
            }
        });
        socket.emit("handshake", "demo");

        proxy = new WebRTCSocket(socket, ctrls.defaultDisplay.checked);
    }

    function loginFailed(){
        ctrls.connectButton.innerHTML = "Login failed. Try again.";
        ctrls.connectButton.className = "primary button";
        msg("Incorrect user name or password!");
    }

    function msg(){
        var txt = fmt.apply(window, map(arguments, function(v){ return v ? v.toString() : ""; }));
        if(currentUser){
            showChat(txt);
        }
        else {
            alert(txt);
        }
    }

    function waitForResources(t){
        lt = t;
        if(app.camera && currentUser){
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

        if(wasFocused && focused){
            app.update(dt);

            roll = app.head.getValue("roll");
            pitch = app.head.getValue("pitch")
                + app.gamepad.getValue("pitch")
                + app.mouse.getValue("pitch");
            heading = app.head.getValue("heading") 
                + app.gamepad.getValue("heading")
                + app.touch.getValue("heading")
                + app.mouse.getValue("heading")
                + startHeading;

            pointerHeading = heading + app.mouse.getValue("pointerHeading");

            if(ctrls.defaultDisplay.checked){
                //
                // update user position and view
                //

                currentUser.dHeading = (heading - currentUser.heading) / dt;
                strafe = app.keyboard.getValue("strafeRight")
                    + app.keyboard.getValue("strafeLeft")
                    + app.gamepad.getValue("strafe");
                drive = app.keyboard.getValue("driveBack")
                    + app.keyboard.getValue("driveForward")
                    + app.gamepad.getValue("drive")
                    + app.touch.getValue("drive");

                if(onground || currentUser.position.y < -0.5){                
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
                    currentUser.velocity.x = currentUser.velocity.x * 0.9 + strafe * 0.1;
                    currentUser.velocity.z = currentUser.velocity.z * 0.9 + drive * 0.1;
                }

                currentUser.velocity.y -= dt * GRAVITY;

                //
                // do collision detection
                //
                var len = currentUser.velocity.length() * dt;
                direction.copy(currentUser.velocity);
                direction.normalize();
                testPoint.copy(currentUser.position);
                testPoint.y += PLAYER_HEIGHT / 2;
                raycaster.set(testPoint, direction);
                raycaster.far = len;
                intersections = raycaster.intersectObject(app.scene, true);
                for(var i = 0; i < intersections.length; ++i){
                    var inter = intersections[i];
                    if(inter.object.parent.isSolid){
                        testPoint.copy(inter.face.normal);
                        testPoint.applyEuler(inter.object.parent.rotation);
                        currentUser.velocity.reflect(testPoint);
                        var d = testPoint.dot(app.camera.up);
                        if(d > 0.75){
                            currentUser.position.y = inter.point.y + 0.0125;
                            currentUser.velocity.y = 0.1;
                            onground = true;
                        }
                    }
                }

                // ground test
                testPoint.copy(currentUser.position);
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
                        currentUser.position.y = inter.point.y;
                        currentUser.velocity.y = 0;
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
                        x: currentUser.position.x,
                        y: currentUser.position.y,
                        z: currentUser.position.z,
                        dx: currentUser.velocity.x,
                        dy: currentUser.velocity.y,
                        dz: currentUser.velocity.z,
                        heading: currentUser.heading,
                        dHeading: (currentUser.heading - currentUser.lastHeading) / DFRAME,
                        isRunning: currentUser.velocity.length() > 0
                    };
                    currentUser.lastHeading = currentUser.heading;
                    if(socket){
                        socket.emit("userState", state);
                    }
                }
            }

            //
            // update avatars
            //
            for(var key in users){
                var user = users[key];
                testPoint.copy(user.velocity);
                testPoint.multiplyScalar(dt);
                user.position.add(testPoint);
                user.heading += user.dHeading * dt;
                user.rotation.set(0, user.heading, 0, "XYZ");
                if(user !== currentUser){ 
                    // we have to offset the rotation of the name so the user
                    // can read it.
                    user.nameObj.rotation.set(0, currentUser.heading - user.heading, 0, "XYZ");
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

            app.render(pitch, heading, roll, currentUser);
        }

        wasFocused = focused;
    }

    function login(){
        if(socket && ctrls.connectButton.classList.contains("primary")){
            userName = ctrls.userNameField.value;
            var password = ctrls.passwordField.value;
            if(userName && password){
                socket.once("salt", function(salt){
                    var hash = CryptoJS.SHA512(salt + password).toString();
                    socket.emit("hash", hash);
                });
                ctrls.connectButton.innerHTML = "Connecting...";
                ctrls.connectButton.className = "secondary button";
                socket.emit("login", {
                    userName: userName,
                    email: ctrls.emailField.value
                });
            }
            else{
                msg("Please complete the form.");
            }
        }
        else{
            msg("No socket available.");
        }
    };

    function readChatBox(){
        showTyping(true, true, ctrls.textEntry.value);
        ctrls.textEntry.value = "";
    }

    function resetLocation(){
        currentUser.position.set(0, 2, 0);
        currentUser.velocity.set(0, 0, 0);
    }

    function showTyping(isLocal, isComplete, text){
        if(currentUser){
            if(lastText){
                currentUser.remove(lastText);
                lastText = null;
            }

            if(isComplete){
                if(socket){
                    socket.emit("chat", text);
                }
            }
            else{
                if(isLocal && socket){
                    socket.emit("typing", text);
                }
                if(text !== null && text !== undefined){
                    var textObj= new VUI.Text(
                        text, 0.125,
                        "white", "transparent",
                        0, PLAYER_HEIGHT, -4,
                        "right");
                    lastText = textObj;
                    currentUser.add(textObj);
                    if(clickSound){
                        app.audio.playBufferImmediate(clickSound, 0.5);
                    }
                }
            }
        }
    }

    function shiftLines(){
        for(var i = 0; i < chatLines.length; ++i){
            chatLines[i].position.y = PLAYER_HEIGHT + (chatLines.length - i) * CHAT_TEXT_SIZE * 1.333 - 1;
        }
    }

    function showChat(msg){
        msg = typeof(msg) === "string" ? msg : fmt("[$1]: $2", msg.userName, msg.text);
        if(currentUser){
            if(userName === msg.userName){
                showTyping(true, false, null);
            }
            var textObj= new VUI.Text(
                msg, CHAT_TEXT_SIZE,
                "white", "transparent",
                -2, 0, -5, "left");
            currentUser.add(textObj);
            chatLines.push(textObj);
            shiftLines();
            setTimeout(function(){
                currentUser.remove(textObj);
                chatLines.shift();
                shiftLines();
            }, 3000);
        }

        var div = document.createElement("div");
        div.appendChild(document.createTextNode(msg));
        ctrls.chatLog.appendChild(div);
        ctrls.chatLog.scrollTop = ctrls.chatLog.scrollHeight;

        if(!focused && window.Notification){
            makeNotification(msg);
        }
    }

    function makeNotification(msg){
        if (Notification.permission === "granted") {
            if(lastNote !== null){
                msg = lastNote.body + "\n" + msg;
                lastNote.close();
                lastNote = null;
            }
            lastNote = new Notification(document.title, {
                icon: "../ico/chat.png",
                body: msg
            });
            lastNote.addEventListener("close", function(){
                lastNote = null;
            }, false);
            return lastNote;
        }
    };

    function updateUserState(firstTime, userState){
        var user = user || users[userState.userName];
        if(!user){
            setTimeout(addUser.bind(this, userState), 1);
        }
        else{
            if(firstTime){
                user.position.set(
                    userState.x, 
                    // just in case the user falls through the world, 
                    // reloading will get them back to level.
                    Math.max(0, userState.y), 
                    userState.z);
                user.lastHeading = user.heading = userState.heading;
                user.dHeading = 0;
                if(userState.userName === userName){
                    startHeading = user.heading;
                }
            }
            else{
                user.velocity.set(
                    ((userState.x + userState.dx * DFRAME) - user.position.x) / DFRAME,
                    ((userState.y + userState.dy * DFRAME) - user.position.y) / DFRAME,
                    ((userState.z + userState.dz * DFRAME) - user.position.z) / DFRAME);
                user.dHeading = ((userState.heading + userState.dHeading * DFRAME) - user.heading) / DFRAME;
            }
        }
    }

    function addUser(userState, skipMakingChatList){
        var user = null;
        if(!users[userState.userName]){
            if(userName === DEFAULT_USER_NAME
                || userState.userName !== userName){
                user = new THREE.Object3D();        
                var model = bearModel.clone();
                user.animation = model.animation;
                model.position.z = 1.33;
                user.add(model);

                user.nameObj = new VUI.Text(
                    userState.userName, 0.5,
                    "white", "transparent",
                    0, PLAYER_HEIGHT + 2.5, 0, 
                    "center");
                user.add(user.nameObj);

                user.velocity = new THREE.Vector3();

                if(userState.userName === DEFAULT_USER_NAME){
                    currentUser = user;
                }
                else{
                    msg("$1 has joined", userState.userName);
                }

                app.scene.add(user);
            }
            else{
                delete users[DEFAULT_USER_NAME];
                user = currentUser;
            }
        }
        else {
            user = users[userState.userName];
        }

        users[userState.userName] = user;
        updateUserState(true, userState);

        if(!skipMakingChatList){
            makeChatList();
        }
    }

    function userLeft(userName){
        if(users[userName]){
            msg("$1 has disconnected", userName);
            app.scene.remove(users[userName]);
            help(ctrls.userList);
            delete users[userName];
            makeChatList();
        }
    }

    function listUsers(users){
        ctrls.connectButton.className = "secondary button";
        ctrls.connectButton.innerHTML = "Connected";
        proxy.connect(userName);
        users.sort(function(a){ return (a.userName === userName) ? -1 : 1;});
        for(var i = 0; i < users.length; ++i){
            addUser(users[i], true);
        }
        makeChatList();
    }

    function makeChatList(){
        var list = [];
        for(var k in users){
            list.push(k);
        }
        list.sort();
        ctrls.userList.innerHTML = "";
        for(var i = 0; i < list.length; ++i){
            if(list[i] !== DEFAULT_USER_NAME){
                var entry = document.createElement("div");
                entry.appendChild(document.createTextNode(list[i]));
                ctrls.userList.appendChild(entry);
            }
        }
    }

    ctrls.textEntry.addEventListener("change", readChatBox, false);
    ctrls.connectButton.addEventListener("click", login, false);
    
    app = new Application("holodeck", resetLocation, showTyping, proxy);
    
    window.addEventListener("focus", function(){
        focused = true;
    }, false);

    window.addEventListener("blur", function(){
        focused = false;
    }, false);

    document.addEventListener("focus", function(){
        focused = true;
    }, false);

    document.addEventListener("blur", function(){
        focused = false;
    }, false);


    ModelLoader.loadCollada("models/scene2.dae", function(object){
        mainScene = object;
        app.scene.add(object);
        app.scene.add(app.hand);
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

    var bearModel = new ModelLoader("models/bear.dae", function(){
        addUser({x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 0, heading: 0, dHeading: 0, userName: userName});
    });

    app.audio.loadBuffer("music/click.mp3", null, function(buffer){
        clickSound = buffer;
    });

    app.audio.load3DSound("music/ambient.mp3", true, 0, 0, 0, null, function(amb){
        amb.volume.gain.value = 0.07;
        amb.source.start(0);
    });

    requestAnimationFrame(waitForResources);
}