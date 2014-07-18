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

function toggleFullScreen(){
    if (document.documentElement.requestFullscreen){
        if (!(document.fullscreenElement
            || document.mozFullScreenElement
            || document.webkitFullscreenElement
            || document.msFullscreenElement)){  // current working methods
            document.documentElement.requestFullscreen();
            lockOrientation("landscape-primary");
        }
        else{
            document.exitFullscreen();
        }
    }
}