function MouseInput(name, axisConstraints, commands, socket, oscope, DOMElement){
    DOMElement = DOMElement || document.documentElement;
    ButtonAndAxisInput.call(this, name, axisConstraints, commands, socket, oscope, 1, MouseInput.AXES);

    this.setLocation = function(x, y){
        this.setAxis("X", x);
        this.setAxis("Y", y);
    };

    this.setMovement = function(dx, dy){
        this.incAxis("X", dx);
        this.incAxis("Y", dy);
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
        this.incAxis("Z", event.wheelDelta);
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

inherit(MouseInput, ButtonAndAxisInput);

MouseInput.AXES = ["X", "Y", "Z"];
ButtonAndAxisInput.fillAxes(MouseInput);

/*
https://www.github.com/capnmidnight/VR
Copyright (c) 2014 Sean T. McBeth
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, 
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this 
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, this 
  list of conditions and the following disclaimer in the documentation and/or 
  other materials provided with the distribution.

* Neither the name of Sean T. McBeth nor the names of its contributors
  may be used to endorse or promote products derived from this software without 
  specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
OF THE POSSIBILITY OF SUCH DAMAGE.
*/