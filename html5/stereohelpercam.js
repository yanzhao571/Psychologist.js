var shoot = function(){};

function pageLoad(){
    var camera = document.getElementById("camera"),
        overlay = document.getElementById("overlay"),
        reticle = document.getElementById("reticle"),
        gfx = overlay.getContext("2d"),
        frame = 0,
        size = 0,
        ready = false;

    gfx.clearRect(0,0, overlay.width, overlay.height);
    
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
                frame = 0;
                gfx.clearRect(0, 0, overlay.width, overlay.height);
                reticle.style.display = "block";
            }
        }
    };

    function animate(){
        requestAnimationFrame(animate);
        for(var i = frame; i < 2; ++i){
            gfx.drawImage(camera, size * 0.5, 0, size, camera.height,
                                  i * size, 0, size, camera.height);
                
        }
    }

    setupVideo([{w:1920, h:1080}, "default"], camera, function(){
        camera.width = overlay.width = camera.videoWidth;
        camera.height = overlay.height = camera.videoHeight;
        size = camera.videoWidth * 0.5;
        ready = true;
        animate();
    });
}