var shoot = function(){},
    reset = function(){},
    toggleMenu = function(){},
    swapFrames = function(){},
    showSource = function(){};

function pageLoad(){
    var camera = document.getElementById("camera"),
        overlay = document.getElementById("overlay"),
        reticle = document.getElementById("reticle"),
        gfx = overlay.getContext("2d"),
        frame = 0,
        size = 0,
        ready = false, 
        rotation = 0,
        swap = localStorage.getItem("swap") == "true",
        n = 0,
        options = document.getElementById("options"),
        stdButtonHeight = document.querySelector("a").clientHeight + 8,
        numMenuItems = document.querySelectorAll("#options>li>a").length,
        menuVisible = false,
        frames = [document.createElement("canvas"), document.createElement("canvas")],
        fxs = frames.map(function(f){return f.getContext("2d");});

    function setMenu(){
        options.style.height = px((menuVisible ? numMenuItems : 1) * stdButtonHeight);
    }

    setMenu();

    window.addEventListener("resize", setMenu);

    toggleMenu = function(){
        menuVisible = !menuVisible;
        setMenu();
    };

    swapFrames = function(){
        swap = !swap;
        localStorage.setItem("swap", swap);
    };

    setupOrientation(function(evt){
        rotation = evt.roll;
    });
    
    shoot = function(){
        if(ready){
            if(frame < 2){
                ++frame;
                if(frame == 2){
                    reticle.style.display = "none";
                }
            }
            else if(frame == 2){
                saveAs("image.png", overlay.toDataURL());
                reset();
            }
        }
    };
    
    reset = function(){
        frame = 0;
        reticle.style.display = "block";
        gfx.clearRect(0,0, overlay.width, overlay.height);
        fxs[0].clearRect(0,0, frames[0].width, frames[0].height);
        fxs[1].clearRect(0,0, frames[1].width, frames[1].height);
    };

    reset();

    function animate(){
        requestAnimationFrame(animate);
        for(var i = 0; i < 2; ++i){
            if(i >= frame){                
                fxs[i].save();
                fxs[i].translate(0.5 * size, 0.5 * camera.height);
                fxs[i].rotate(rotation);
                fxs[i].translate(-0.5 * size, -0.5 * camera.height);
                fxs[i].drawImage(camera, size * 0.5, 0, size, camera.height, 0, 0, size, camera.height);
                fxs[i].restore();
            }
            n = swap ? 1 - i: i;
            gfx.drawImage(frames[n], i * size, 0);
        }
    }

    setupVideo([{w:1280, h:720}, {w:1920, h:1080}, "default"], camera, function(){
        size = camera.videoWidth * 0.5;
        frames[0].width = frames[1].width = size;
        camera.width = overlay.width = camera.videoWidth;
        camera.height = overlay.height = frames[0].height = frames[1].height = camera.videoHeight;
        ready = true;
        animate();
    });
}