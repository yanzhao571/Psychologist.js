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
var BG_COLOR = 0x000000,
    PLAYER_HEIGHT = 6.5,
    DEFAULT_USER_NAME = "CURRENT_USER_OFFLINE";
        
function Application(thisName, resetLocation, showTyping, showChat, addUser, updateUserState, userLeft, listUsers, msg){
    this.ctrls = findEverything();
    this.hideControlsTimeout = null;
    this.focused = true;
    this.wasFocused = false;
    this.msg = msg,
    this.userName = DEFAULT_USER_NAME;
    
    if(this.ctrls.appCacheReload.style.display === "none" && navigator.onLine){
        this.ctrls.loginForm.style.display = "";
        this.ctrls.connectButton.addEventListener("click", this.login.bind(this), false);
        
        this.socket = io.connect(document.location.hostname, {
            "reconnect": true,
            "reconnection delay": 1000,
            "max reconnection attempts": 60
        });
        this.socket.on("typing", showTyping.bind(window, false, false));
        this.socket.on("chat", showChat);    
        this.socket.on("userJoin", addUser);
        this.socket.on("userState", updateUserState.bind(window, false));
        this.socket.on("userLeft", userLeft);
        this.socket.on("loginFailed", function(){
            this.ctrls.connectButton.innerHTML = "Login failed. Try again.";
            this.ctrls.connectButton.className = "primary button";
            msg("Incorrect user name or password!");
        }.bind(this));
        this.socket.on("userList", listUsers);
        this.socket.on("disconnect", msg.bind(window));
        this.socket.on("handshakeFailed", console.error.bind(console, "Failed to connect to websocket server. Available socket controllers are:"));
        this.socket.on("handshakeComplete", function(controller){
            if(controller === "demo"
                && this.ctrls.autoLogin.checked
                && this.ctrls.userNameField.value.length > 0
                && this.ctrls.passwordField.value.length > 0){
                this.ctrls.connectButton.click();
            }
        }.bind(this));
        this.socket.emit("handshake", "demo");
        this.proxy = new WebRTCSocket(this.socket, this.ctrls.defaultDisplay.checked);
    }
    
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
            renderingStyle: {value: "regular" },
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
            renderingStyle: {value: "rift" },
            defaultDisplay: {checked: false}
        }},
        { name: NO_HMD_SMARTPHONE, values:{
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
            touchEnable: {checked: true},
            touchTransmit: {checked: true},
            touchReceive: {checked: false},
            headEnable: {checked: true},
            headTransmit: {checked: true},
            headReceive: {checked: false},
            renderingStyle: {value: "regular" },
            defaultDisplay: {checked: true}
        }}
    ]);
    
    //
    // restoring the options the user selected
    //
    var formStateKey = thisName + " - formState";
    var formState = getSetting(formStateKey);
    writeForm(this.ctrls, formState);
    window.addEventListener("beforeunload", function(){
        var state = readForm(this.ctrls);
        setSetting(formStateKey, state);
        this.speech.enable(false);
    }.bind(this), false);
    
    //
    // speech input
    //
    this.speech = new SpeechInput("speech", [
        { name: "options", keywords: ["options"], commandUp: this.toggleOptions.bind(this) },
        { name: "chat", preamble: true, keywords: ["message"], commandUp: function (){ 
            showTyping(true, true, this.speech.getValue("chat")); 
        }.bind(this)}
    ], this.proxy);    
    this.setupModuleEvents(this.speech, "speech");
    
    //
    // keyboard input
    //
    this.keyboard = new KeyboardInput("keyboard", [
        { name: "strafeLeft", buttons: [-KeyboardInput.A, -KeyboardInput.LEFTARROW] },
        { name: "strafeRight", buttons: [KeyboardInput.D, KeyboardInput.RIGHTARROW] },
        { name: "driveForward", buttons: [-KeyboardInput.W, -KeyboardInput.UPARROW] },
        { name: "driveBack", buttons: [KeyboardInput.S, KeyboardInput.DOWNARROW] },
        { name: "resetPosition", buttons: [KeyboardInput.P], commandUp: resetLocation },
        { name: "chat", preamble: true, buttons: [KeyboardInput.T], commandUp: showTyping.bind(window, true)}
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
        { name: "pointerPress", buttons: [1], integrate: true, scale: -10, offset: 5, min: -0.4, max: 0 }
    ], this.proxy);
    this.setupModuleEvents(this.mouse, "mouse");
    
    //
    // smartphone orientation sensor-based head tracking
    //
    this.head = new MotionInput("head", [
        { name: "heading", axes: [-MotionInput.HEADING] },
        { name: "pitch", axes: [MotionInput.PITCH] },
        { name: "roll", axes: [-MotionInput.ROLL] }
    ], this.proxy);
    this.setupModuleEvents(this.head, "head");
    
    //
    // capacitive touch screen input
    //
    this.touch = new TouchInput("touch", null, [
        { name: "heading", axes: [TouchInput.DX0], integrate: true },
        { name: "drive", axes: [-TouchInput.DY0] }
    ], this.proxy);
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
    // Leap Motion input
    //
    this.hand = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 4, 4), 
        new THREE.MeshPhongMaterial({color: 0xffff00, emissive: 0x7f7f00})
    );
    this.hand.name = "HAND0";
    this.hand.add(new THREE.PointLight(0xffff00, 1, 7));
    var leapCommands = [];
    leapCommands.push({ name: "HAND0X", axes: [LeapMotionInput["HAND0X"]], scale: 0.015 });
    leapCommands.push({ name: "HAND0Y", axes: [LeapMotionInput["HAND0Y"]], scale: 0.015, offset: -4 });
    leapCommands.push({ name: "HAND0Z", axes: [LeapMotionInput["HAND0Z"]], scale: -0.015, offset: 3 });
    this.leap = new LeapMotionInput("leap", null, leapCommands, this.proxy);
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

    var closers = document.getElementsByClassName("closeSectionButton");
    for(var i = 0; i < closers.length; ++i){
        closers[i].addEventListener("click", this.hideOptions.bind(this), false);
    }
    
    //
    // Audio setup
    //
    this.audio = new Audio3DOutput();
    
    //
    // THREE.js setup
    //
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.ctrls.frontBuffer }),
    this.renderer.setClearColor(BG_COLOR);
    this.setSize(window.innerWidth, window.innerHeight);
    this.testPoint = new THREE.Vector3();
}

Application.prototype.update = function(dt){
    THREE.AnimationHandler.update(dt);
    this.speech.update(dt);
    this.keyboard.update(dt);
    this.mouse.update(dt);
    this.head.update(dt);
    this.touch.update(dt);
    this.gamepad.update(dt);
    this.leap.update(dt);
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
    if(this.hideControlsTimeout !== null){
        clearTimeout(this.hideControlsTimeout);
    }
    this.hideControlsTimeout = setTimeout(this.hideOnscreenControls.bind(this), 3000);
};

Application.prototype.render = function(pitch, heading, roll, currentUser){
    //
    // update audio
    //
    this.testPoint.copy(currentUser.position);
    this.testPoint.divideScalar(10);
    this.audio.setPosition(this.testPoint.x, this.testPoint.y, this.testPoint.z);
    this.audio.setVelocity(currentUser.velocity.x, currentUser.velocity.y, currentUser.velocity.z);
    this.testPoint.normalize();
    this.audio.setOrientation(this.testPoint.x, this.testPoint.y, this.testPoint.z, 0, 1, 0);
    
    //
    // update the camera
    //
    this.camera.rotation.set(pitch, heading, roll, "YZX");
    this.camera.position.copy(currentUser.position);
    this.camera.position.y += PLAYER_HEIGHT;

    //
    // draw
    //
    if (this.effect){
        this.effect.render(this.scene, this.camera);
    }
    else {
        this.renderer.render(this.scene, this.camera);
    }
};

Application.prototype.chooseRenderingEffect = function(type){
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
    if(this.socket && this.ctrls.connectButton.classList.contains("primary")){
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
            this.msg("Please complete the form.");
        }
    }
    else{
        this.msg("No socket available.");
    }
};