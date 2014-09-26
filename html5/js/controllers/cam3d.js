include(0,
    ["lib/three/three.js",
    "lib/three/OculusRiftEffect.js",
    "lib/Blob.js",
    "lib/canvas-toBlob.js",
    "lib/FileSaver.js",
    "js/input/NetworkedInput.js",
    "js/input/MotionInput.js",
    "js/input/SpeechInput.js",
    "js/camera.js"],
    function (){
    var picture = document.getElementById("picture"),
        reticle = document.getElementById("reticle"),
        controls = document.getElementById("controls"),
        options = document.getElementById("options"),
        captureButton = document.getElementById("captureButton"),
        resetButton = document.getElementById("resetButton"),
        optionsButton = document.getElementById("optionsButton"),
        changeModeButton = document.getElementById("changeModeButton"),
        reticleButton = document.getElementById("reticleButton"),
        speechButton = document.getElementById("speechButton"),
        fullScreenButton = document.getElementById("fullScreenButton"),
        stdButtonHeight = document.querySelector("a").clientHeight + 8,
        numMenuItems = document.querySelectorAll("#options>li>a").length,
        camera = document.createElement("video"),
        frames = [document.createElement("canvas"), document.createElement("canvas")],
        fxs = frames.map(function(f){return f.getContext("2d");}),
        gfx = picture.getContext("2d"),
        frameIndex = 0,
        size = 0,
        n = 0,
        menuVisible = false,
        buttonsVisible = true,
        speech = null,
        motion = null,
        buttonsTimeout = null,
        modes = ["anaglyph", "stereoscope", "crosseye"],
        modeIndex = localStorage.getItem("mode"),
        showReticle = localStorage.getItem("reticle") != "false",
        useSpeech = localStorage.getItem("speech") == "true";


    if(/^\d+$/.test(modeIndex)){
        modeIndex = parseInt(modeIndex, 10);
    }
    else{
        modeIndex = 0;
    }

    ////////// menu
    function showMenu(){
        if(!menuVisible){
            toggleMenu();
        }
    }

    function hideMenu(){
        if(menuVisible){ 
            toggleMenu(); 
        }
    }

    function toggleMenu(){
        menuVisible = !menuVisible;
        setMenu();
    };

    function setMenu(){
        optionsButton.innerHTML = menuVisible ? "close options" : "options";
        options.style.height = px((menuVisible ? numMenuItems : 1) * stdButtonHeight);
    }

    window.addEventListener("resize", setMenu, false);

    setMenu();
    
    ////////// buttons
    function hideButtonsLater(){
        if(buttonsTimeout != null){
            clearTimeout(buttonsTimeout);
        }
        buttonsTimeout = setTimeout(hideButtons, 3000);
    }

    function setButtons(){
        controls.style.opacity = options.style.opacity = buttonsVisible || menuVisible ? 1 : 0;
        if(buttonsVisible){
            hideButtonsLater();
        }
    }

    function toggleButtons(){
        buttonsVisible = !buttonsVisible;
        setButtons();
    }

    function showButtons(evt){
        if(evt){
            evt.preventDefault();
        }
        if(!buttonsVisible){
            toggleButtons();
        }
        hideButtonsLater();
    }

    function hideButtons(){
        if(buttonsVisible){
            toggleButtons();
        }
    }

    window.addEventListener("mousemove", showButtons, false);
    picture.addEventListener("touchend", showButtons, false);
    
    setButtons();

    ///////////// reticle
    function toggleReticle (){
        if(modes[modeIndex] != "anaglyph"){
            showReticle = !showReticle;
            localStorage.setItem("reticle", showReticle);
            setReticle();
        }
    }

    function setReticle(){
        reticle.style.display = (showReticle && modes[modeIndex] != "anaglyph") ? "block" : "none";
        reticleButton.innerHTML = modes[modeIndex] != "anaglyph" 
            ? showReticle ? "hide reticle" : "show reticle"
            : "reticle disabled";
    }

    setReticle();

    /////////////// window size
    

    function setSize(){
        picture.style.height = reticle.style.height = px(picture.clientWidth * camera.videoHeight / camera.videoWidth);
    }

    window.addEventListener("resize", setSize, false);
    
    
    ////////////// speech
    function toggleSpeech(){
        useSpeech = !useSpeech;
        localStorage.setItem("speech", useSpeech);
        setSpeech();
    }

    function setSpeech(){
        speechButton.innerHTML =
            speech.isAvailable()
                ? (useSpeech ? "disable speech" : "enable speech")
                : "speech unavailable";
        if(useSpeech){
            speech.start();
        }
        else{
            speech.stop();
        }
    }

    /////////////// drawing
    function changeMode(){
        modeIndex = (modeIndex + 1) % modes.length;
        localStorage.setItem("mode", modeIndex);
        reset();
    };

    function setMode(mode){
        modeIndex = modes.indexOf(mode);
        reset();
    }    
    
    function capture(){
        if(frameIndex < 2){
            ++frameIndex;
            if(frameIndex == 2){
                reticle.style.display = "none";
                captureButton.innerHTML = "save";
            }
        }
        else if(frameIndex == 2){
            var data = picture.toDataURL();

            picture.toBlob(function(blob){
                var date = new Date().toLocaleString().replace(/\//g, "-");
		        saveAs(blob, fmt("$1-$2.jpg", modes[modeIndex], date));
            }, "image/jpg");

            reset();
        }
    };

    function animate(){
        requestAnimationFrame(animate);
        for(var i = 0; i < 2; ++i){
            if(i >= frameIndex){                
                fxs[i].save();
                if(motion){
                    fxs[i].translate(0.5 * size, 0.5 * camera.height - Math.sin(motion.getValue("pitch")) * camera.height);
                    fxs[i].rotate(motion.getValue("roll"));
                }
                fxs[i].translate(-0.5 * size, -0.5 * camera.height);
                fxs[i].drawImage(camera, (camera.width - size) * 0.5, 0, size, camera.height, 
                                         0, 0, size, camera.height);

                fxs[i].restore();
            }

            switch(modes[modeIndex]){
                case "stereoscope":
                    gfx.drawImage(frames[i], i * size, 0);
                break;
                case "crosseye":
                    gfx.drawImage(frames[i], (1-i) * size, 0);
                break;
                case "anaglyph":
                    var img = fxs[i].getImageData(0, 0, frames[i].width, frames[i].height);
                    for(var n = 0, l = img.data.length; n < l; n+=4){
                        if(i == 0){
                            img.data[n + 1] = 0;
                            img.data[n + 2] = 0;
                        }
                        else{
                            img.data[n] = 0;
                        }
                    }
                    fxs[i].putImageData(img, 0, 0);
                    gfx.globalCompositeOperation = (i == 0) ? "source-over" : "lighter";
                    gfx.drawImage(frames[i], 0, 0);
                break;
            }
        }
    }

    animate();

    /////////////// the rest

    function goFullscreen(){
        toggleFullScreen();
        reset();
    };
    
    function reset(){
        size = camera.videoWidth * (modes[modeIndex] == "anaglyph" ? 1 : 0.5);
        for(var i = 0; i < frames.length; ++i){
            var f = frames[i];
            f.width = size;
            f.height = camera.videoHeight;
            fxs[i].clearRect(0, 0, f.width, f.height);
        }
        camera.width = picture.width = camera.videoWidth;
        camera.height = picture.height = camera.videoHeight;
        frameIndex = 0;
        setReticle();
        setSize();
        gfx.clearRect(0,0, picture.width, picture.height);
        changeModeButton.innerHTML = modes[modeIndex];
        fullScreenButton.innerHTML = isFullScreenMode() ? "windowed" : "fullscreen";
        captureButton.innerHTML = "capture";
    };

    var videoModes = isMobile 
        ? [{w:640, h:480}, "default"]
        : [{w:1920, h:1080}, {w:1280, h:720}, {w:1024, h:768}, {w:640, h:480}, "default"];
    videoModes.push("default");
    setupVideo(videoModes, camera, reset);

    captureButton.addEventListener("click", capture, false);
    resetButton.addEventListener("click", reset, false);
    optionsButton.addEventListener("click", toggleMenu, false);
    changeModeButton.addEventListener("click", changeMode, false);
    reticleButton.addEventListener("click", toggleReticle, false);
    speechButton.addEventListener("click", toggleSpeech, false);
    fullScreenButton.addEventListener("click", goFullscreen, false);

    motion = new MotionInput("motion", null, [
        { name: "heading", axes: [-MotionInput.HEADING] },
        { name: "pitch", axes: [MotionInput.PITCH] },
        { name: "roll", axes: [-MotionInput.ROLL] }
    ]);

    speech = new SpeechInput("speech", [{
        keywords: ["capture", "save", "safe", "save picture", "shoot", "shit", "snap", "take", "take picture"],
        command: capture
    },{
        keywords: ["reset"],
        command: reset
    },{
        keywords: ["menu", "options"], 
        command: toggleMenu
    },{
        keywords: ["show menu", "show options", "show option", "open menu", "open options", "open option"], 
        command:  showMenu
    },{
        keywords: ["hide menu", "hide options", "hide option", "close menu", "close options", "close option"], 
        command:  hideMenu
    },{
        keywords: ["target"], 
        command: toggleReticle
    },{
        keywords: ["change mode"], 
        command: changeMode
    },{
        keywords: ["stereo"], 
        command: setMode.bind(window, "stereoscope")
    },{
        keywords: ["cross eyed", "cross eye", "crosseyed", "crosseye"], 
        command: setMode.bind(window, "crosseye")
    },{
        keywords: ["green", "green red", "red red", "green green", "red", "red green", "anaglyph"], 
        command: setMode.bind(window, "anaglyph")
    }]);

    setSpeech();
});