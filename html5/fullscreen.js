// full-screen-ism polyfill
if (!document.documentElement.requestFullscreen){
    if (document.documentElement.msRequestFullscreen){
        document.documentElement.requestFullscreen = document.documentElement.msRequestFullscreen;
        document.exitFullscreen = document.msExitFullscreen;
    }
    else if (document.documentElement.mozRequestFullScreen){
        document.documentElement.requestFullscreen = document.documentElement.mozRequestFullScreen;
        document.exitFullscreen = document.mozCancelFullScreen;
    }
    else if (document.documentElement.webkitRequestFullscreen){
        document.documentElement.requestFullscreen = function (){
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
        };
        document.exitFullscreen = document.webkitExitFullscreen;
    }
}

screen.lockOrientation = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation || function(){};

function isFullScreenMode(){
    return (document.fullscreenElement
            || document.mozFullScreenElement
            || document.webkitFullscreenElement
            || document.msFullscreenElement);
}

function toggleFullScreen(){
    if (document.documentElement.requestFullscreen){
        if(isFullScreenMode()){
            document.exitFullscreen();
        }
        else{
            document.documentElement.requestFullscreen();
            var interval = setInterval(function(){
                if(isFullScreenMode()){
                    clearInterval(interval);
                    screen.lockOrientation("landscape-primary");
                }
            }, 1000);
        }
    }
}