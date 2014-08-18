function cameraTrackingTest(){
    var ball = document.getElementById("ball"),
        picture = document.getElementById("picture"),
        camera = document.createElement("video"),
        gfx = picture.getContext("2d"),
        instructions = document.getElementById('instructions'),
        keyboard,
        img, weight, n, i, c, dn, 
        power = 63, threshold = 0.35,
        cr = 1/(255 * 3),
        cg = cr,
        cb = cr, 
        running = false,
        bx = 0, by = 0,
        bleft = 0, btop = 0, lastX, lastY, dx, dy;

    if(instructions){
        instructions.style.display = "none";
    }

    ball.style.display = "block";

    function changeParameters(dp, dt){
        power += dp;
        if(power == 0){
            power += 2 * dp;
        }
        if(0.05 <= threshold + dt && threshold + dt < 1){
            threshold += dt;
        }
        console.log("power", power, "threshold", threshold);
    }
    
    // use WASD or arrow keys to change contrast and threshold parameters
    keyboard = new KeyboardInput([
        {name: "up", buttons: [87, 38], commandDown: changeParameters.bind(window, 1, 0), dt: 125},
        {name: "down", buttons: [83, 40], commandDown: changeParameters.bind(window, -1, 0), dt: 125},
        {name: "left", buttons: [65, 37], commandDown: changeParameters.bind(window, 0, -0.05), dt: 125},
        {name: "right", buttons: [68, 39], commandDown: changeParameters.bind(window, 0, 0.05), dt: 125}
    ]);

    picture.addEventListener("touchstart", function(event){
        lastX = event.touches[0].clientX;
        lastY = event.touches[0].clientY;
    });

    picture.addEventListener("touchmove", function(event){
        dx = event.touches[0].clientX - lastX;
        dy = event.touches[0].clientY - lastY;

        if(Math.abs(dx) > 5){
            dx = dx / Math.abs(dx);
        }
        else{
            dx = 0;
        }
        if(Math.abs(dy) > 5){
            dy = dy / Math.abs(dy);
        }
        else{
            dy = 0;
        }
        changeParameters(-dy, dx * 0.05);
        lastX = event.touches[0].clientX;
        lastY = event.touches[0].clientY;
    });
 
    function animate(){
        requestAnimationFrame(animate);
        if(running){
            gfx.drawImage(camera, 0, 0);
        
            img = gfx.getImageData(0, 0, picture.width, picture.height);

            bx = by = c = 0;
            for(i = 0; i < img.data.length; i += 4){
                weight = Math.pow(cr * img.data[i] + cg * img.data[i+1] + cb * img.data[i+2], power);

                if(weight > threshold){
                    n = i / 4;
                    bx += Math.floor(n) % img.width;
                    by += Math.floor(n / img.width);
                    ++c;
                }

                // skip this part if you don't want to visualize the tracking
                if(weight > threshold){
                    img.data[i] = 255;
                    img.data[i+1] = 255;
                    img.data[i+2] = 255;
                }
                else{
                    img.data[i] = 0;
                    img.data[i+1] = 0;
                    img.data[i+2] = 0;
                }
            }
            
            // skip this part if you don't want to visualize the tracking
            gfx.putImageData(img, 0, 0);
            gfx.font = "20px Arial";
            gfx.fillStyle = "#700";
            gfx.fillText(fmt("power: $1, threshold: $2.00", power, threshold), 10, 20);

            bx /= c;
            by /= c;
        }
        if(bx && by){
            bleft = (bleft + bx) / 2;
            btop = (btop + by) / 2;
        }
        ball.style.left = px(document.body.clientWidth * bleft / picture.width - ball.clientWidth / 2);
        ball.style.top = px(document.body.clientHeight * btop / picture.height - ball.clientHeight / 2);
    }

    animate();

    function proportionalResize(elem){
        var w = document.body.clientWidth,
            h = document.body.clientHeight;
        if(w < h){
            elem.style.width = px(w);
            picture.style.height = px(picture.height * w / picture.width);
        }
        else{
            elem.style.height = px(h);
            elem.style.width = px(picture.width * h / picture.height);
        }
    }

    function mappedResize(elem){
        elem.style.width = px(document.body.clientWidth);
        elem.style.height = px(document.body.clientHeight);
    }

    window.addEventListener("resize", mappedResize.bind(window, picture), false);
    
    function reset(){
        camera.height = picture.height = camera.videoHeight;
        camera.width = picture.width = camera.videoWidth;
        mappedResize(picture);
        running = true;
    };

    var videoModes = [{w:640, h:480}, "default"];

    setupVideo(videoModes, camera, reset);
}