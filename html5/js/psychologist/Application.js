/* 
 * Copyright (C) 2014 Sean McBeth
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
    Create a new VR Application!

    `name` - name the application, for use with saving settings separately from other applications on the same domain
    `sceneModel` - the scene to present to the user, in COLLADA format
    `buttonModel` - the model to use to make buttons, in COLLADA format
    `buttonOptions` - configuration parameters for buttons
        `maxThrow` - the distance the button may move
        `minDeflection` - the angle boundary in which to do hit tests on the button
        `colorUnpressed` - the color of the button when it is not depressed
        `colorPressed` - the color of the button when it is depressed
    `avatarModel` - the model to use for players in the game, in COLLADA format
    `avatarHeight` - the offset from the ground at which to place the camera
    `walkSpeed` - how quickly the avatar moves across the ground
    `clickSound` - the sound that plays when the user types
    `ambientSound` - background hum or music
    `options` - optional values to override defaults
        `gravity` - the acceleration applied to falling objects (default: 9.8)
        `backgroundColor` - the color that WebGL clears the background with before drawing (default: 0x000000)
        `drawDistance` - the far plane of the camera (default: 500)
        `chatTextSize` - the size of a single line of text, in world units (default: 0.25)
        `dtNetworkUpdate` - the amount of time to allow to elapse between sending state to teh server (default: 0.125)
 */
function Application(name, sceneModel, buttonModel, buttonOptions, avatarModel, avatarHeight, walkSpeed, clickSound, ambientSound, options){
    this.options = combineDefaults(options, Application);
    this.ctrls = findEverything();
    this.users = {};
    this.chatLines = [];
    this.listeners = {
        ready: [],
        update: []
    };
    this.userName = Application.DEFAULT_USER_NAME;
    this.avatarHeight = avatarHeight;
    this.walkSpeed = walkSpeed;
    this.focused = true;
    this.wasFocused = false;
    this.onground = false;
    this.lt = 0;
    this.frame = 0;
    this.currentUser = null;
    this.mainScene = null;
    
    //
    // The various options, and packs of them when selecting from a dropdown
    // list. This makes it easy to preconfigure the program to certain specs
    // and let the user override the others.
    //
    var NO_HMD_SMARTPHONE = "Smartphone - no HMD";
    this.stateList = new StateList(this.ctrls.deviceTypes, this.ctrls, [
        { name: "-- select device type --" },
        { name: "PC", values:{
            speechEnable: {checked: false},
            speechTransmit: {checked: false},
            speechReceive: {checked: false},
            keyboardEnable: {checked: true},
            keyboardTransmit: {checked: true},
            keyboardReceive: {checked: false},
            mouseEnable: {checked: true},
            mouseTransmit: {checked: true},
            mouseReceive: {checked: false},
            gamepadEnable: {checked: true},
            gamepadTransmit: {checked: true},
            gamepadReceive: {checked: false},
            leapEnable: {checked: true},
            leapTransmit: {checked: true},
            leapReceive: {checked: false},
            touchEnable: {checked: false},
            touchTransmit: {checked: false},
            touchReceive: {checked: true},
            headEnable: {checked: false},
            headTransmit: {checked: false},
            headReceive: {checked: true},
            locationEnable: {checked: false},
            locationTransmit: {checked: false},
            locationReceive: {checked: true},
            renderingStyle: {value: "regular"},
            defaultDisplay: {checked: true}
        }},
        { name: "Smartphone HMD", values:{
            speechEnable: {checked: false},
            speechTransmit: {checked: false},
            speechReceive: {checked: true},
            keyboardEnable: {checked: false},
            keyboardTransmit: {checked: false},
            keyboardReceive: {checked: true},
            mouseEnable: {checked: false},
            mouseTransmit: {checked: false},
            mouseReceive: {checked: true},
            gamepadEnable: {checked: false},
            gamepadTransmit: {checked: false},
            gamepadReceive: {checked: true},
            leapEnable: {checked: false},
            leapTransmit: {checked: false},
            leapReceive: {checked: true},
            touchEnable: {checked: false},
            touchTransmit: {checked: false},
            touchReceive: {checked: true},
            headEnable: {checked: true},
            headTransmit: {checked: true},
            headReceive: {checked: false},
            locationEnable: {checked: true},
            locationTransmit: {checked: true},
            locationReceive: {checked: false},
            renderingStyle: {value: "rift" },
            defaultDisplay: {checked: false}
        }},
        { name: NO_HMD_SMARTPHONE, values:{
            speechEnable: {checked: false},
            speechTransmit: {checked: false},
            speechReceive: {checked: false},
            keyboardEnable: {checked: false},
            keyboardTransmit: {checked: false},
            keyboardReceive: {checked: false},
            mouseEnable: {checked: false},
            mouseTransmit: {checked: false},
            mouseReceive: {checked: false},
            gamepadEnable: {checked: false},
            gamepadTransmit: {checked: false},
            gamepadReceive: {checked: false},
            leapEnable: {checked: false},
            leapTransmit: {checked: false},
            leapReceive: {checked: false},
            touchEnable: {checked: true},
            touchTransmit: {checked: true},
            touchReceive: {checked: false},
            headEnable: {checked: true},
            headTransmit: {checked: true},
            headReceive: {checked: false},
            locationEnable: {checked: true},
            locationTransmit: {checked: true},
            locationReceive: {checked: false},
            renderingStyle: {value: "regular" },
            defaultDisplay: {checked: true}
        }}
    ]);
    
    //
    // restoring the options the user selected
    //
    var formStateKey = name + " - formState";
    var formState = getSetting(formStateKey);
    writeForm(this.ctrls, formState);
    window.addEventListener("beforeunload", function(){
        var state = readForm(this.ctrls);
        setSetting(formStateKey, state);
        this.speech.enable(false);
    }.bind(this), false);
        
    //
    // Setup THREE.js
    //
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.ctrls.frontBuffer }),
    this.renderer.setClearColor(this.options.backgroundColor);
    this.setSize(window.innerWidth, window.innerHeight);
    this.testPoint = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 7);
    this.direction = new THREE.Vector3();
    this.buttonFactory = new VUI.ButtonFactory(buttonModel, buttonOptions);
    this.avatar = new ModelLoader(avatarModel, function(){
        this.addUser({x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 0, heading: 0, dHeading: 0, userName: this.userName});
    }.bind(this));    
    ModelLoader.loadScene(sceneModel, function(sceneGraph){
        this.mainScene = sceneGraph;
        this.scene.add(sceneGraph);
        var cam = this.mainScene.Camera.children[0];
        this.camera = new THREE.PerspectiveCamera(cam.fov, cam.aspect, cam.near, this.options.drawDistance);
        this.scene.remove(cam);
        this.scene.add(this.camera);
    }.bind(this));
    
    //
    // Setup audio
    //
    this.audio = new Audio3DOutput();
    this.audio.loadBuffer(clickSound, null, function(buffer){
        this.clickSound = buffer;
    }.bind(this));
    this.audio.load3DSound(ambientSound, true, 0, 0, 0, null, function(amb){
        amb.volume.gain.value = 0.07;
        amb.source.start(0);
    }.bind(this));
    
    //
    // Setup networking
    //
    if(this.ctrls.appCacheReload.style.display === "none" && navigator.onLine){
        this.ctrls.connectButton.addEventListener("click", this.login.bind(this), false);
        
        this.socket = io.connect(document.location.hostname, {
            "reconnect": true,
            "reconnection delay": 1000,
            "max reconnection attempts": 60
        });
        this.socket.on("connect", function(){
            this.socket.emit("handshake", "demo");
            this.ctrls.connectButton.innerHTML = Application.DISCONNECTED_TEXT;
            this.ctrls.connectButton.className = "primary button";
        }.bind(this));
        this.socket.on("typing", this.showTyping.bind(this, false, false));
        this.socket.on("chat", this.showChat.bind(this));    
        this.socket.on("userJoin", this.addUser.bind(this));
        this.socket.on("userState", this.updateUserState.bind(this, false));
        this.socket.on("userLeft", function (userName){
            if(this.users[userName]){
                this.showMessage("$1 has disconnected", userName);
                this.scene.remove(this.users[userName]);
                delete this.users[userName];
                this.makeChatList();
            }
        }.bind(this));
        this.socket.on("loginFailed", function(){
            this.ctrls.connectButton.innerHTML = "Login failed. Try again.";
            this.ctrls.connectButton.className = "primary button";
            this.showMessage("Incorrect user name or password!");
        }.bind(this));
        this.socket.on("userList", function (newUsers){
            this.ctrls.connectButton.innerHTML = Application.CONNECTED_TEXT;
            this.ctrls.connectButton.className = "primary button";
            this.proxy.connect(this.userName);
            newUsers.sort(function(a){ return (a.userName === this.userName) ? -1 : 1;});
            for(var i = 0; i < newUsers.length; ++i){
                this.addUser(newUsers[i], true);
            }
            this.makeChatList();
        }.bind(this));
        this.socket.on("disconnect", function(reason){
            this.ctrls.connectButton.className = "secondary button";
            this.ctrls.connectButton.innerHTML = fmt("Disconnected: $1", reason);
            this.showMessage(reason);
        }.bind(this));
        this.socket.on("handshakeFailed", console.error.bind(console, "Failed to connect to websocket server. Available socket controllers are:"));
        this.socket.on("handshakeComplete", function(controller){
            if(controller === "demo" && this.ctrls.autoLogin.checked){
                this.ctrls.connectButton.click();
            }
        }.bind(this));
        this.proxy = new WebRTCSocket(this.socket, this.ctrls.defaultDisplay.checked);
    }
    
    //
    // speech input
    //
    this.speech = new SpeechInput("speech", [
        { name: "options", keywords: ["options"], commandUp: this.toggleOptions.bind(this) },
        { name: "chat", preamble: true, keywords: ["message"], commandUp: function (){ 
            this.showTyping(true, true, this.speech.getValue("chat")); 
        }.bind(this)}
    ], this.proxy);    
    this.setupModuleEvents(this.speech, "speech");
    
    //
    // keyboard input
    //
    this.keyboard = new KeyboardInput("keyboard", [
        { name: "strafeLeft", buttons: [-KeyboardInput.A, -KeyboardInput.LEFTARROW] },
        { name: "strafeRight", buttons: [KeyboardInput.D, KeyboardInput.RIGHT] },
        { name: "driveForward", buttons: [-KeyboardInput.W, -KeyboardInput.UPARROW] },
        { name: "driveBack", buttons: [KeyboardInput.S, KeyboardInput.DOWNARROW] },
        { name: "camera", buttons: [KeyboardInput.C] },
        { name: "resetPosition", buttons: [KeyboardInput.P], commandUp: function (){
            this.currentUser.position.set(0, 2, 0);
            this.currentUser.velocity.set(0, 0, 0);
        }.bind(this) },
        { name: "chat", preamble: true, buttons: [KeyboardInput.T], commandUp: this.showTyping.bind(this, true)}
    ], this.proxy);    
    this.keyboard.pause(true);
    this.setupModuleEvents(this.keyboard, "keyboard");
    
    //
    // mouse input
    //
    this.mouse = new MouseInput("mouse", [
        { name: "dx", axes: [-MouseInput.X], delta: true, scale: 0.5 },
        { name: "heading", commands: ["dx"], metaKeys: [-NetworkedInput.SHIFT], integrate: true },
        { name: "pointerHeading", commands: ["dx"], metaKeys: [NetworkedInput.SHIFT], integrate: true, min: -Math.PI * 0.2, max: Math.PI * 0.2 },
        { name: "dy", axes: [-MouseInput.Y], delta: true, scale: 0.5 },
        { name: "pitch", commands: ["dy"], metaKeys: [-NetworkedInput.SHIFT], integrate: true, min: -Math.PI * 0.5, max: Math.PI * 0.5 },
        { name: "pointerPitch", commands: ["dy"], metaKeys: [NetworkedInput.SHIFT], integrate: true, min: -Math.PI * 0.125, max: Math.PI * 0.125 },
        { name: "dz", axes: [MouseInput.Z], delta: true },
        { name: "pointerDistance", commands: ["dz"], integrate: true, scale: 0.1, min: 0, max: 10 },
        { name: "pointerPress", buttons: [1], integrate: true, scale: 100, offset: -50, min: 0, max: 5 }
    ], this.proxy);
    this.setupModuleEvents(this.mouse, "mouse");
    
    //
    // smartphone orientation sensor-based head tracking
    //
    this.head = new MotionInput("head", [
        { name: "pitch", axes: [MotionInput.PITCH] },
        { name: "heading", axes: [-MotionInput.HEADING] },
        { name: "roll", axes: [-MotionInput.ROLL] }
    ], this.proxy);
    this.setupModuleEvents(this.head, "head");
    
    //
    // VR HEAD MOUNTED DISPLAY OOOOOH YEAH!
    //
    this.vr = new VRInput("hmd", [
        { name: "pitch", axes: [VRInput.RX] },
        { name: "heading", axes: [VRInput.RY] },
        { name: "roll", axes: [VRInput.RZ] }
    ], this.ctrls.hmdListing, formState && formState.hmdListing || "");
    this.ctrls.hmdListing.addEventListener("change", function(){
        this.vr.connect(this.ctrls.hmdListing.value);
        if(this.ctrls.hmdListing.value){
            this.chooseRenderingEffect("rift");
        }
    }.bind(this));
    
    //
    // capacitive touch screen input
    //
    this.touch = new TouchInput("touch", null, [
        { name: "heading", axes: [TouchInput.DX0], integrate: true },
        { name: "drive", axes: [-TouchInput.DY0] }
    ], this.proxy, null, this.ctrls.frontBuffer);
    this.setupModuleEvents(this.touch, "touch");
    
    //
    // gamepad input
    //
    this.gamepad = new GamepadInput("gamepad", [
        { name: "strafe", axes: [GamepadInput.LSX]},
        { name: "drive", axes: [GamepadInput.LSY]},
        { name: "heading", axes: [-GamepadInput.RSX], integrate: true},
        { name: "pitch", axes: [GamepadInput.RSY], integrate: true},
        { name: "options", buttons: [9], commandUp: this.toggleOptions.bind(this) }
    ], this.proxy);
    this.setupModuleEvents(this.gamepad, "gamepad");
    this.gamepad.addEventListener("gamepadconnected", function (id){
        if (!this.gamepad.isGamepadSet() && confirm(fmt("Would you like to use this gamepad? \"$1\"", id))){
            this.gamepad.setGamepad(id);
        }
    }.bind(this), false);
    
    //
    // geolocation input
    //
    this.location = new LocationInput("location", [], this.proxy);
    this.setupModuleEvents(this.location, "location");
    
    //
    // passthrough camera
    //
    this.passthrough = new CameraInput(this.ctrls.cameraListing, formState && formState.cameraListing || "", 1, 0, 0, -1);
    this.passthrough.mesh.visible = false;
    this.ctrls.cameraListing.addEventListener("change", function(){
        this.passthrough.connect(this.ctrls.cameraListing.value);
    }.bind(this));
    
    //
    // Leap Motion input
    //
    this.hand = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 4, 4), 
        new THREE.MeshPhongMaterial({color: 0xffff00, emissive: 0x7f7f00})
    );
    this.hand.name = "HAND0";
    this.hand.add(new THREE.PointLight(0xffff00, 1, 7));
    this.hand.velocity = new THREE.Vector3();
    this.scene.add(this.hand);
    var leapCommands = [];
    leapCommands.push({ name: "HAND0X", axes: [LeapMotionInput.HAND0X], scale: -0.015 });
    leapCommands.push({ name: "HAND0Y", axes: [LeapMotionInput.HAND0Y], scale: 0.015, offset: -4 });
    leapCommands.push({ name: "HAND0Z", axes: [LeapMotionInput.HAND0Z], scale: -0.015, offset: 3 });
    this.leap = new LeapMotionInput("leap", leapCommands, this.proxy);
    this.setupModuleEvents(this.leap, "leap");
    
    //
    // setting up all other event listeners
    //
    window.addEventListener("touchend", this.showOnscreenControls.bind(this), false);
    
    window.addEventListener("mousemove", function(){
        if(!MouseInput.isPointerLocked()){
            this.showOnscreenControls();
        }
    }.bind(this), false);

    window.addEventListener("keyup", function(evt){
        if(evt.keyCode === KeyboardInput.GRAVEACCENT){
            this.toggleOptions();
        }
    }.bind(this), false);
    
    window.addEventListener("resize", function (){
        this.setSize(window.innerWidth, window.innerHeight);
    }.bind(this), false);
    
    window.addEventListener("focus", function(){
        this.focused = true;
    }.bind(this), false);

    window.addEventListener("blur", function(){
        this.focused = false;
    }.bind(this), false);

    document.addEventListener("focus", function(){
        this.focused = true;
    }.bind(this), false);

    document.addEventListener("blur", function(){
        this.focused = false;
    }.bind(this), false);
    
    this.ctrls.fullScreenButton.addEventListener("click", function(){
        requestFullScreen();
        this.mouse.requestPointerLock();
    }.bind(this), false);
    
    this.ctrls.menuButton.addEventListener("click", this.showOptions.bind(this), false);
    
    this.ctrls.renderingStyle.addEventListener("change", function(){
        this.chooseRenderingEffect(this.ctrls.renderingStyle.value);
    }.bind(this), false);
    
    this.ctrls.textEntry.addEventListener("change", function (){
        this.showTyping(true, true, this.ctrls.textEntry.value);
        this.ctrls.textEntry.value = "";
    }.bind(this), false);

    var closers = document.getElementsByClassName("closeSectionButton");
    for(var i = 0; i < closers.length; ++i){
        closers[i].addEventListener("click", this.hideOptions.bind(this), false);
    }
}
    
Application.DEFAULTS = {
    gravity: 9.8, // the acceleration applied to falling objects
    backgroundColor: 0x000000, // the color that WebGL clears the background with before drawing
    drawDistance: 500, // the far plane of the camera
    chatTextSize: 0.25, // the size of a single line of text, in world units
    dtNetworkUpdate: 0.125 // the amount of time to allow to elapse between sending state to teh server
};

Application.CONNECTED_TEXT = "Disconnect";
Application.DISCONNECTED_TEXT = "Connect";
Application.DEFAULT_USER_NAME = "CURRENT_USER_OFFLINE";
Application.RIGHT = new THREE.Vector3(-1, 0, 0);

Application.prototype.makeButton = function(toggle){
    var btn = this.buttonFactory.create(toggle);
    this.mainScene.buttons.push(btn);
    this.mainScene[btn.name] = btn;
    this.scene.add(btn.base);
    return btn;
};

Application.prototype.addEventListener = function(event, thunk){
    if(this.listeners[event]){
        this.listeners[event].push(thunk);
    }
};

Application.prototype.fire = function(name, arg1, arg2, arg3, arg4){
    for(var i = 0; i < this.listeners[name].length; ++i){
        this.listeners[name][i](arg1, arg2, arg3, arg4);
    }
};

Application.prototype.setupModuleEvents = function(module, name){
    var e = this.ctrls[name + "Enable"],
        t = this.ctrls[name + "Transmit"],
        r = this.ctrls[name + "Receive"];
        z = this.ctrls[name + "Zero"];
    e.addEventListener("change", function(){
        module.enable(e.checked);
        t.disabled = !e.checked;
        if(t.checked && t.disabled){
            t.checked = false;
        }
    });
    t.addEventListener("change", function(){
        module.transmit(t.checked);
    });
    r.addEventListener("change", function(){
        module.receive(r.checked);
    });

    if(z && module.zeroAxes){
        z.addEventListener("click", module.zeroAxes.bind(module), false);
    }

    module.enable(e.checked);
    module.transmit(t.checked);
    module.receive(r.checked);
    t.disabled = !e.checked;
    if(t.checked && t.disabled){
        t.checked = false;
    }
};

Application.prototype.showOptions = function(){
    this.ctrls.options.style.display = "";
    this.keyboard.pause(true);
    this.mouse.exitPointerLock();
};

Application.prototype.hideOptions = function(){        
    this.ctrls.options.style.display = "none";
    requestFullScreen();
    this.keyboard.pause(false);
    this.showOnscreenControls();
    this.mouse.requestPointerLock();
};

Application.prototype.toggleOptions = function(){
    var show = this.ctrls.options.style.display !== "";
    if(show){
        this.showOptions();
    }
    else{
        this.hideOptions();
    }
};
    
//
// the touch-screen and mouse-controls for accessing the options screen
//
Application.prototype.hideOnscreenControls = function(){
    this.ctrls.onScreenControls.style.display = "none";
    this.hideControlsTimeout = null;
};
    
Application.prototype.showOnscreenControls = function(){
    this.ctrls.onScreenControls.style.display = "";
    if(this.hideControlsTimeout){
        clearTimeout(this.hideControlsTimeout);
    }
    this.hideControlsTimeout = setTimeout(this.hideOnscreenControls.bind(this), 3000);
};

Application.prototype.chooseRenderingEffect = function(type){
    if(this.lastRenderingType !== type){
        switch(type){
            case "anaglyph": this.effect = new THREE.AnaglyphEffect(this.renderer, 5, window.innerWidth, window.innerHeight); break;
            case "stereo": this.effect = new THREE.StereoEffect(this.renderer); break;
            case "rift": this.effect = new THREE.OculusRiftEffect(this.renderer, {
                worldFactor: 1,
                HMD: {
                    hResolution: screen.availWidth,
                    vResolution: screen.availHeight,
                    hScreenSize: 0.126,
                    vScreenSize: 0.075,
                    interpupillaryDistance: 0.064,
                    lensSeparationDistance: 0.064,
                    eyeToScreenDistance: 0.051,
                    distortionK: [1, 0.22, 0.06, 0.0],
                    chromaAbParameter: [0.996, -0.004, 1.014, 0.0]
                }
            }); break;
            default: 
                this.effect = null;
                type = "regular";
                break;
        }

        if(this.ctrls.renderingStyle.value !== type){
            this.ctrls.renderingStyle.value = type;
        }

        if((this.lastRenderingType === "rift" || this.lastRenderingType === "stereo")
            && (type === "anaglyph" || type === "regular")){
            alert("The page must reload to enable the new settings.");
            document.location.reload();
        }
        this.lastRenderingType = type;
    }
};

Application.prototype.setSize = function(w, h){
    if(this.camera){
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

    this.chooseRenderingEffect(this.ctrls.renderingStyle.value);

    this.renderer.setSize(w, h);
    if (this.effect){
        this.effect.setSize(w, h);
    }
};

Application.prototype.login = function(){
    if(this.socket 
        && this.socket.connected
        && this.ctrls.connectButton.classList.contains("primary")){
        if(this.ctrls.connectButton.innerHTML === Application.DISCONNECTED_TEXT){
            this.userName = this.ctrls.userNameField.value;
            var password = this.ctrls.passwordField.value;
            if(this.userName && password){
                this.socket.once("salt", function(salt){
                    var hash = CryptoJS.SHA512(salt + password).toString();
                    this.socket.emit("hash", hash);
                }.bind(this));
                this.ctrls.connectButton.innerHTML = "Connecting...";
                this.ctrls.connectButton.className = "secondary button";
                this.socket.emit("login", {
                    userName: this.userName,
                    email: this.ctrls.emailField.value
                });
            }
            else{
                this.showMessage("Please complete the form.");
            }
        }
        else if(this.ctrls.connectButton.innerHTML === Application.CONNECTED_TEXT){ 
           this.socket.emit("logout");
           this.ctrls.connectButton.innerHTML = Application.DISCONNECTED_TEXT;
        }        
    }
    else{
        this.showMessage("No socket available.");
    }
};

Application.prototype.addUser = function(userState, skipMakingChatList){
    var user = null;
    if(!this.users[userState.userName]){
        if(this.userName === Application.DEFAULT_USER_NAME
            || userState.userName !== this.userName){
            user = new THREE.Object3D();        
            var model = this.avatar.clone();
            user.animation = model.animation;
            model.position.z = 1.33;
            user.add(model);

            user.nameObj = new VUI.Text(
                userState.userName, 0.5,
                "white", "transparent",
                0, this.avatarHeight + 2.5, 0, 
                "center");
            user.add(user.nameObj);

            user.velocity = new THREE.Vector3();

            if(userState.userName === Application.DEFAULT_USER_NAME){
                this.currentUser = user;
            }
            else{
                this.showMessage("$1 has joined", userState.userName);
            }

            this.scene.add(user);
        }
        else{
            delete this.users[Application.DEFAULT_USER_NAME];
            user = this.currentUser;
        }
    }
    else {
        user = this.users[userState.userName];
    }

    this.users[userState.userName] = user;
    this.updateUserState(true, userState);

    if(!skipMakingChatList){
        this.makeChatList();
    }
};

Application.prototype.updateUserState = function(firstTime, userState){
    var user = user || this.users[userState.userName];
    if(!user){
        setTimeout(this.addUser.bind(this, userState), 1);
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
        }
        else{
            user.velocity.set(
                ((userState.x + userState.dx * this.options.dtNetworkUpdate) - user.position.x) / this.options.dtNetworkUpdate,
                ((userState.y + userState.dy * this.options.dtNetworkUpdate) - user.position.y) / this.options.dtNetworkUpdate,
                ((userState.z + userState.dz * this.options.dtNetworkUpdate) - user.position.z) / this.options.dtNetworkUpdate);
            user.dHeading = ((userState.heading + userState.dHeading * this.options.dtNetworkUpdate) - user.heading) / this.options.dtNetworkUpdate;
        }
    }
};

Application.prototype.makeChatList = function(){
    var list = [];
    for(var k in this.users){
        list.push(k);
    }
    list.sort();
    this.ctrls.userList.innerHTML = "";
    for(var i = 0; i < list.length; ++i){
        if(list[i] !== Application.DEFAULT_USER_NAME){
            var entry = document.createElement("div");
            entry.appendChild(document.createTextNode(list[i]));
            this.ctrls.userList.appendChild(entry);
        }
    }
};

Application.prototype.showMessage = function(){
    var msg = fmt.apply(window, map(arguments, function(v){ return v ? v.toString() : ""; }));
    if(this.currentUser){
        this.showChat(msg);
    }
    else {
        alert(msg);
    }
};

Application.prototype.showTyping = function(isLocal, isComplete, text){
    if(this.currentUser){
        if(this.lastText){
            this.currentUser.remove(this.lastText);
            this.lastText = null;
        }

        if(isComplete){
            if(this.socket){
                this.socket.emit("chat", text);
            }
        }
        else{
            if(isLocal && this.socket){
                this.socket.emit("typing", text);
            }
            if(text){
                var textObj= new VUI.Text(
                    text, 0.125,
                    "white", "transparent",
                    0, this.avatarHeight, -4,
                    "right");
                this.lastText = textObj;
                this.currentUser.add(textObj);
                if(this.clickSound){
                    this.audio.playBufferImmediate(this.clickSound, 0.5);
                }
            }
        }
    }
};

Application.prototype.shiftLines = function(){
    for(var i = 0; i < this.chatLines.length; ++i){
        this.chatLines[i].position.y = this.avatarHeight + (this.chatLines.length - i) * this.options.chatTextSize * 1.333 - 1;
    }
};

Application.prototype.showChat = function(msg){
    msg = typeof(msg) === "string" ? msg : fmt("[$1]: $2", msg.userName, msg.text);
    if(this.currentUser){
        if(this.userName === msg.userName){
            this.showTyping(true, false, null);
        }
        var textObj= new VUI.Text(
            msg, this.options.chatTextSize,
            "white", "transparent",
            -2, 0, -5, "left");
        this.currentUser.add(textObj);
        this.chatLines.push(textObj);
        this.shiftLines();
        setTimeout(function(){
            this.currentUser.remove(textObj);
            this.chatLines.shift();
            this.shiftLines();
        }.bind(this), 3000);
    }

    var div = document.createElement("div");
    div.appendChild(document.createTextNode(msg));
    this.ctrls.chatLog.appendChild(div);
    this.ctrls.chatLog.scrollTop = this.ctrls.chatLog.scrollHeight;

    if(!this.focused && window.Notification){
        this.makeNotification(msg);
    }
};

Application.prototype.makeNotification = function(msg){
    if (Notification.permission === "granted") {
        if(this.lastNote){
            msg = this.lastNote.body + "\n" + msg;
            this.lastNote.close();
            this.lastNote = null;
        }
        this.lastNote = new Notification(document.title, {
            icon: "../ico/chat.png",
            body: msg
        });
        this.lastNote.addEventListener("close", function(){
            this.lastNote = null;
        }.bind(this), false);
        return this.lastNote;
    }
};

Application.prototype.start = function(){
    var waitForResources = function(t){
        this.lt = t;
        if(this.camera && this.mainScene && this.currentUser && this.buttonFactory.template){
            this.camera.add(this.passthrough.mesh);
            this.leap.start();
            this.animate = this.animate.bind(this);
            this.fire("ready");
            requestAnimationFrame(this.animate);
        }
        else{
            requestAnimationFrame(waitForResources);
        }
    }.bind(this);
    
    requestAnimationFrame(waitForResources);
};

Application.prototype.animate = function(t){
    requestAnimationFrame(this.animate);
    var dt = (t - this.lt) * 0.001;
    this.lt = t;

    if(this.wasFocused && this.focused){
        THREE.AnimationHandler.update(dt);
        this.speech.update(dt);
        this.keyboard.update(dt);
        this.mouse.update(dt);
        this.head.update(dt);
        this.vr.update(dt);
        this.touch.update(dt);
        this.gamepad.update(dt);
        this.leap.update(dt);
        
        this.passthrough.mesh.visible = this.keyboard.isDown("camera");
        if(this.passthrough.mesh.visible){
            this.passthrough.update();
        }

        var roll = this.head.getValue("roll")
            + this.vr.getValue("roll");
        var pitch = this.head.getValue("pitch")
            + this.gamepad.getValue("pitch")
            + this.mouse.getValue("pitch")
            + this.vr.getValue("pitch");
        var heading = this.head.getValue("heading") 
            + this.gamepad.getValue("heading")
            + this.touch.getValue("heading")
            + this.mouse.getValue("heading")
            + this.vr.getValue("heading");
        var pointerPitch = pitch 
            + this.leap.getValue("HAND0Y")
            + this.mouse.getValue("pointerPitch");
        var pointerHeading = heading 
            + this.leap.getValue("HAND0X")
            + this.mouse.getValue("pointerHeading");
        var pointerDistance = (this.leap.getValue("HAND0Z") 
            + this.mouse.getValue("pointerDistance") 
            + this.mouse.getValue("pointerPress")
            + 2) / Math.cos(pointerPitch);
        var strafe = 0;
        var drive = 0;

        if(this.ctrls.defaultDisplay.checked){
            //
            // update user position and view
            //

            this.currentUser.dHeading = (heading - this.currentUser.heading) / dt;
            strafe = this.keyboard.getValue("strafeRight")
                + this.keyboard.getValue("strafeLeft")
                + this.gamepad.getValue("strafe");
            drive = this.keyboard.getValue("driveBack")
                + this.keyboard.getValue("driveForward")
                + this.gamepad.getValue("drive")
                + this.touch.getValue("drive");

            if(this.onground || this.currentUser.position.y < -0.5){                
                if(this.autoWalking){
                    strafe = 0;
                    drive = -0.5;
                }
                if(strafe || drive){
                    len = this.walkSpeed * Math.min(1, 1 / Math.sqrt(drive * drive + strafe * strafe));
                }
                else{
                    len = 0;
                }

                strafe *= len;
                drive *= len;
                len = strafe * Math.cos(pointerHeading) + drive * Math.sin(pointerHeading);
                drive = drive * Math.cos(pointerHeading) - strafe * Math.sin(pointerHeading);
                strafe = len;
                this.currentUser.velocity.x = this.currentUser.velocity.x * 0.9 + strafe * 0.1;
                this.currentUser.velocity.z = this.currentUser.velocity.z * 0.9 + drive * 0.1;
            }
            
            this.currentUser.velocity.y -= dt * this.options.gravity;

            //
            // do collision detection
            //
            var len = this.currentUser.velocity.length() * dt;
            this.direction.copy(this.currentUser.velocity);
            this.direction.normalize();
            this.testPoint.copy(this.currentUser.position);
            this.testPoint.y += this.avatarHeight / 2;
            this.raycaster.set(this.testPoint, this.direction);
            this.raycaster.far = len;
            var intersections = this.raycaster.intersectObject(this.scene, true);
            for(var i = 0; i < intersections.length; ++i){
                var inter = intersections[i];
                if(inter.object.parent.isSolid){
                    this.testPoint.copy(inter.face.normal);
                    this.testPoint.applyEuler(inter.object.parent.rotation);
                    this.currentUser.velocity.reflect(this.testPoint);
                    var d = this.testPoint.dot(this.camera.up);
                    if(d > 0.75){
                        this.currentUser.position.y = inter.point.y;
                        this.currentUser.velocity.y = 0;
                        this.onground = true;
                    }
                }
            }

            // ground test
            this.testPoint.copy(this.currentUser.velocity)
                .multiplyScalar(dt)
                .add(this.currentUser.position);
            var GROUND_TEST_HEIGHT = 3;
            this.testPoint.y += GROUND_TEST_HEIGHT;
            this.direction.set(0, -1, 0);
            this.raycaster.set(this.testPoint, this.direction);
            this.raycaster.far = GROUND_TEST_HEIGHT * 2;
            intersections = this.raycaster.intersectObject(this.scene, true);
            for(var i = 0; i < intersections.length; ++i){
                var inter = intersections[i];
                if(inter.object.parent.isSolid && inter.distance < GROUND_TEST_HEIGHT){
                    this.testPoint.copy(inter.face.normal);
                    this.testPoint.applyEuler(inter.object.parent.rotation);
                    this.currentUser.position.y = inter.point.y;
                    this.currentUser.velocity.y = 0;
                    this.onground = true;
                }
            }

            //
            // send a network update of the user's position, if it's been enough 
            // time since the last update (don'dt want to flood the server).
            //
            this.frame += dt;
            if(this.frame > this.options.dtNetworkUpdate){
                this.frame -= this.options.dtNetworkUpdate;
                var state = {
                    x: this.currentUser.position.x,
                    y: this.currentUser.position.y,
                    z: this.currentUser.position.z,
                    dx: this.currentUser.velocity.x,
                    dy: this.currentUser.velocity.y,
                    dz: this.currentUser.velocity.z,
                    heading: this.currentUser.heading,
                    dHeading: (this.currentUser.heading - this.currentUser.lastHeading) / this.options.dtNetworkUpdate,
                    isRunning: this.currentUser.velocity.length() > 0
                };
                this.currentUser.lastHeading = this.currentUser.heading;
                if(this.socket){
                    this.socket.emit("userState", state);
                }
            }
        }

        //
        // update avatars
        //
        for(var key in this.users){
            var user = this.users[key];
            this.testPoint.copy(user.velocity);
            this.testPoint.multiplyScalar(dt);
            user.position.add(this.testPoint);
            user.heading += user.dHeading * dt;
            user.rotation.set(0, user.heading, 0, "XYZ");
            if(user !== this.currentUser){ 
                // we have to offset the rotation of the name so the user
                // can read it.
                user.nameObj.rotation.set(0, this.currentUser.heading - user.heading, 0, "XYZ");
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
        this.direction.set(0, 0, -pointerDistance)
            .applyAxisAngle(Application.RIGHT, -pointerPitch)
            .applyAxisAngle(this.camera.up, pointerHeading);

        this.testPoint.copy(this.hand.position);
        this.hand.position.copy(this.camera.position).add(this.direction);
        this.hand.velocity.copy(this.hand.position).sub(this.testPoint);

        for(var j = 0; j < this.mainScene.buttons.length; ++j){
            var btn = this.mainScene.buttons[j];
            var tag = btn.test(this.camera.position, this.hand);
            if(tag){
                this.hand.position.copy(tag);
            }
            else{
                btn.test(this.camera.position, this.currentUser);
            }
        }

        this.fire("update", dt);        
        //
        // update audio
        //
        this.testPoint.copy(this.currentUser.position);
        this.testPoint.divideScalar(10);
        this.audio.setPosition(this.testPoint.x, this.testPoint.y, this.testPoint.z);
        this.audio.setVelocity(this.currentUser.velocity.x, this.currentUser.velocity.y, this.currentUser.velocity.z);
        this.testPoint.normalize();
        this.audio.setOrientation(this.testPoint.x, this.testPoint.y, this.testPoint.z, 0, 1, 0);

        //
        // update the camera
        //
        this.camera.rotation.set(pitch, heading, roll, "YZX");
        this.camera.position.copy(this.currentUser.position);
        this.camera.position.y += this.avatarHeight;

        //
        // draw
        //
        if (this.effect){
            this.effect.render(this.scene, this.camera);
        }
        else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    this.wasFocused = this.focused;
};




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
    
    function axis(length, width){
        return obj3(
            box(length, width, width, 0xff0000),
            box(width, width, length, 0x00ff00),
            box(width, length, width, 0x0000ff)
        );
    }