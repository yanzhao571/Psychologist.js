function setupPointerLock(canvas, onMouseMove){
    canvas.requestPointerLock = canvas.requestPointerLock
        || canvas.webkitRequestPointerLock
        || canvas.mozRequestPointerLock;

    document.exitPointerLock = document.exitPointerLock
        || document.webkitExitPointerLock
        || document.mozExitPointerLock;

    function isPointerLocked(){
        return document.pointerLockElement === canvas
            || document.webkitPointerLockElement === canvas
            || document.mozPointerLockElement === canvas;
    }

    window.addEventListener("click", function(){
        if(!isPointerLocked()){
            canvas.requestPointerLock();
        }
        else{
            document.exitPointerLock();
        }
    }, false);

    document.addEventListener('pointerlockchange', onLockChange, false);
    document.addEventListener('mozpointerlockchange', onLockChange, false);
    document.addEventListener('webkitpointerlockchange', onLockChange, false);

    function onLockChange() {
        if(isPointerLocked()) {
            window.addEventListener("mousemove", onMouseMove, false);
        }
        else {
            window.removeEventListener("mousemove", onMouseMove, false);
        }
    }
}