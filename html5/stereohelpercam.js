var capture = function(){},
    reset = function(){},
    goFullscreen = function(){},
    toggleMenu = function(){},
    changeMode = function(){},
    showSource = function(){};

function pageLoad(){
    var camera = document.createElement("video"),
        overlay = document.getElementById("overlay"),
        reticle = document.getElementById("reticle"),
        changeModeButton = document.getElementById("changeModeButton"),
        fullScreenButton = document.getElementById("fullScreenButton"),
        optionsButton = document.getElementById("optionsButton"),
        captureButton = document.getElementById("captureButton"),
        gfx = overlay.getContext("2d"),
        frameIndex = 0,
        size = 0,
        rotation = 0,
        pitch = 0,
        dPitch = 0,
        modes = ["anaglyph", "stereoscope", "crosseye"],
        modeIndex = localStorage.getItem("mode"),
        n = 0,
        options = document.getElementById("options"),
        stdButtonHeight = document.querySelector("a").clientHeight + 8,
        numMenuItems = document.querySelectorAll("#options>li>a").length,
        menuVisible = false,
        frames = [document.createElement("canvas"), document.createElement("canvas"), document.createElement("canvas")],
        fxs = frames.map(function(f){return f.getContext("2d");});

    if(/^\d+$/.test(modeIndex)){
        modeIndex = parseInt(modeIndex, 10);
    }
    else{
        modeIndex = 0;
    }

    function setMenu(){
        optionsButton.innerHTML = menuVisible ? "[-] options" : "[+] options";
        options.style.height = px((menuVisible ? numMenuItems : 1) * stdButtonHeight);
    }

    setMenu();

    window.addEventListener("resize", setMenu);

    toggleMenu = function(){
        menuVisible = !menuVisible;
        setMenu();
    };

    goFullscreen = function(){
        toggleFullScreen();
        reset();
    };

    changeMode = function(btn){
        modeIndex = (modeIndex + 1) % modes.length;
        localStorage.setItem("mode", modeIndex);
        reset();
    };

    setupOrientation(function(evt){
        rotation = evt.roll;
        if(frameIndex == 0){
            pitch = evt.pitch;
        }
        dPitch = evt.pitch - pitch;
    });
    
    capture = function(){
        if(frameIndex < 2){
            ++frameIndex;
            if(frameIndex == 2){
                reticle.style.display = "none";
                captureButton.innerHTML = "save";
            }
        }
        else if(frameIndex == 2){
            var data = overlay.toDataURL();

            overlay.toBlob(function(blob) {
		        saveAs(blob, "image.jpg");
            }, "image/jpg");

            reset();
        }
    };
    
    reset = function(){
        size = camera.videoWidth * (modes[modeIndex] == "anaglyph" ? 1 : 0.5);
        frames.forEach(function(f, i){
            f.width = size;
            f.height = camera.videoHeight;
            fxs[i].clearRect(0, 0, f.width, f.height);
        });
        camera.width = overlay.width = camera.videoWidth;
        camera.height = overlay.height = camera.videoHeight;
        frameIndex = 0;
        reticle.style.display = (modes[modeIndex] == "anaglyph" ? "none" : "block");
        gfx.clearRect(0,0, overlay.width, overlay.height);
        changeModeButton.innerHTML = modes[modeIndex];
        fullScreenButton.innerHTML = isFullScreenMode() ? "windowed" : "fullscreen";
        captureButton.innerHTML = "capture";
    };

    function animate(){
        requestAnimationFrame(animate);
        for(var i = 0; i < 2; ++i){
            if(i >= frameIndex){                
                fxs[i].save();
                fxs[i].translate(0.5 * size, 0.5 * camera.height - Math.sin(dPitch) * camera.height);
                fxs[i].rotate(rotation);
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

    function setMode(mode){
        modeIndex = modes.indexOf(mode);
        reset();
    }

    var videoModes = isMobile 
        ? [{w:640, h:480}, "default"]
        : [{w:1920, h:1080}, {w:1280, h:720}, {w:1024, h:768}, {w:640, h:480}, "default"];
    videoModes.push("default");
    setupVideo(videoModes, camera, reset);
    setupSpeech(function(command){
        console.log(command);
        switch(command){
            case "capture": case "save": case "safe": case "save picture": case "shoot": case "snap": case "take": case "take picture": capture(); break;
            case "reset": reset(); break;
            case "menu": case "options": toggleMenu(); break;
            case "open menu": case "open options": if(!menuVisible){ toggleMenu(); } break;
            case "close menu": case "close options": if(menuVisible){ toggleMenu(); } break;
            case "change mode": changeMode(); break;
            case "stereo": setMode("stereoscope"); break
            case "cross eyed": case "cross eye": case "crosseyed": case "crosseye": setMode("crosseye"); break
            case "green": case "green red": case "red red": case "green green": case "red": case "red green": case "anaglyph": setMode("anaglyph"); break
            case "target": reticle.style.display = (reticle.style.display == "none") ? "block" : "none"; break;
        }
    });
    animate();
}