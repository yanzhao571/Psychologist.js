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
function MouseInput(commands, socket, DOMElement){
    NetworkedInput.call(this, "mouse", commands, socket, 1, ["x", "y", "z"]);

    this.setLocation = function(x, y){
        this.setAxis("x", x);
        this.setAxis("y", y);
    }

    this.setMovement = function(dx, dy){
        this.incAxis("x", dx);
        this.incAxis("y", dy);
    }

    this.readEvent = function(event){
        if(isLocked()){
            this.setMovement(
                event.webkitMovementX || event.mozMovementX || event.movementX || 0,
                event.webkitMovementY || event.mozMovementY || event.movementY || 0);
        }
        else{
            this.setLocation(event.clientX, event.clientY);
        }
    }

    window.addEventListener("mousedown", function(event){
        this.setButton(event.button, true);
        this.readEvent(event);
    }.bind(this), false);

    window.addEventListener("mouseup", function(event){
        this.setButton(event.button, false);
        this.readEvent(event);
    }.bind(this), false);

    window.addEventListener("mousemove", this.readEvent.bind(this), false);

    window.addEventListener("mousewheel", function(event){
        this.incAxis("z", event.wheelDelta);
        this.readEvent(event);
    }.bind(this), false);


    var listeners = {
            pointerlockchanged: []
        };

    this.addEventListener = function(event, handler, bubbles){
        if(event == "pointerlockchange"){
            if(document.exitPointerLock){ document.addEventListener('pointerlockchange', handler, bubbles); }
            else if(document.mozExitPointerLock){ document.addEventListener('mozpointerlockchange', handler, bubbles); }
            else if(document.webkitExitPointerLock){ document.addEventListener('webkitpointerlockchange', handler, bubbles); }
        }
    };

    this.removeEventListener = function(event, handler, bubbles){
        if(event == "pointerlockchange"){
            if(document.exitPointerLock){ document.removeEventListener('pointerlockchange', handler, bubbles); }
            else if(document.mozExitPointerLock){ document.removeEventListener('mozpointerlockchange', handler, bubbles); }
            else if(document.webkitExitPointerLock){ document.removeEventListener('webkitpointerlockchange', handler, bubbles); }
        }
    };
    
    DOMElement = DOMElement || document.documentElement;
    DOMElement.requestPointerLock = DOMElement.requestPointerLock
        || DOMElement.webkitRequestPointerLock
        || DOMElement.mozRequestPointerLock;

    this.requestPointerLock = function(){
        if(!this.isPointerLocked()){
            DOMElement.requestPointerLock();
        }
    }

    document.exitPointerLock = document.exitPointerLock
        || document.webkitExitPointerLock
        || document.mozExitPointerLock;

    this.exitPointerLock = document.exitPointerLock.bind(document);

    function isLocked(){
        return document.pointerLockElement === DOMElement
            || document.webkitPointerLockElement === DOMElement
            || document.mozPointerLockElement === DOMElement;
    };

    this.isPointerLocked = isLocked;
}

inherit(MouseInput, NetworkedInput);