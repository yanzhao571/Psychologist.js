function MouseInput(name, commands, socket, oscope, DOMElement){
    DOMElement = DOMElement || document.documentElement;
    ButtonAndAxisInput.call(this, name, commands, socket, oscope, 1, MouseInput.AXES);

    this.setLocation = function(x, y){
        this.setAxis("X", x);
        this.setAxis("Y", y);
    };

    this.setMovement = function(dx, dy){
        this.setAxis("X", dx + this.getAxis("X"));
        this.setAxis("Y", dy + this.getAxis("Y"));
    };

    this.readEvent = function(event){
        if(this.isPointerLocked()){
            this.setMovement(
                event.webkitMovementX || event.mozMovementX || event.movementX || 0,
                event.webkitMovementY || event.mozMovementY || event.movementY || 0);
        }
        else{
            this.setLocation(event.clientX, event.clientY);
        }
    };

    DOMElement.addEventListener("mousedown", function(event){
        this.setButton(event.button, true);
        this.readEvent(event);
    }.bind(this), false);

    DOMElement.addEventListener("mouseup", function(event){
        this.setButton(event.button, false);
        this.readEvent(event);
    }.bind(this), false);

    DOMElement.addEventListener("mousemove", this.readEvent.bind(this), false);

    DOMElement.addEventListener("mousewheel", function(event){
        this.setAxis("Z", this.getAxis("Z") + event.wheelDelta);
        this.readEvent(event);
    }.bind(this), false);

    this.addEventListener = function(event, handler, bubbles){
        if(event === "pointerlockchange"){
            if(document.exitPointerLock){ document.addEventListener('pointerlockchange', handler, bubbles); }
            else if(document.mozExitPointerLock){ document.addEventListener('mozpointerlockchange', handler, bubbles); }
            else if(document.webkitExitPointerLock){ document.addEventListener('webkitpointerlockchange', handler, bubbles); }
        }
    };

    this.removeEventListener = function(event, handler, bubbles){
        if(event === "pointerlockchange"){
            if(document.exitPointerLock){ document.removeEventListener('pointerlockchange', handler, bubbles); }
            else if(document.mozExitPointerLock){ document.removeEventListener('mozpointerlockchange', handler, bubbles); }
            else if(document.webkitExitPointerLock){ document.removeEventListener('webkitpointerlockchange', handler, bubbles); }
        }
    };
    
    DOMElement.requestPointerLock = DOMElement.requestPointerLock
        || DOMElement.webkitRequestPointerLock
        || DOMElement.mozRequestPointerLock
        || function(){};

    this.requestPointerLock = function(){
        if(!this.isPointerLocked()){
            DOMElement.requestPointerLock();
        }
    };

    this.exitPointerLock = document.exitPointerLock.bind(document);

    this.isPointerLocked = function (){
        return document.pointerLockElement === DOMElement
            || document.webkitPointerLockElement === DOMElement
            || document.mozPointerLockElement === DOMElement;
    };

    this.togglePointerLock = function(){
        if(this.isPointerLocked()){
            this.exitPointerLock();
        }
        else{
            this.requestPointerLock();
        }
    };
}

MouseInput.AXES = ["X", "Y", "Z"];
ButtonAndAxisInput.inherit(MouseInput);