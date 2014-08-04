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

    canvas.addEventListener("click", function(){
        if(!isPointerLocked()){
            canvas.requestPointerLock();
        }
    }, false);

    document.addEventListener('pointerlockchange', onLockChange, false);
    document.addEventListener('mozpointerlockchange', onLockChange, false);
    document.addEventListener('webkitpointerlockchange', onLockChange, false);

    function onLockChange() {
        if(isPointerLocked()) {
            canvas.addEventListener("mousemove", onMouseMove, false);
        }
        else {
            canvas.removeEventListener("mousemove", onMouseMove, false);
        }
    }
}