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
function MouseInput(commands, DOMelement, socket){
    NetworkedInput.call(this, "mouse", commands, socket, 1);
    DOMelement = DOMelement || document.documentElement;
    var mouseState = {
            buttons: [{pressed: false, value: 0},{pressed: false, value: 0},{pressed: false, value: 0}],
            axes: [],
            alt: false, ctrl: false, meta: false, shift: false
        },
        BASE = ["x", "y", "z"],
        AXES = BASE.concat(BASE.map(function(v){return "d" + v;})).concat(BASE.map(function(v){return "l" + v;}));
        listeners = {
            pointerlockchanged: []
        };

    AXES.forEach(function(v, i){ mouseState.axes[i] = 0; });

    this.update = function(){
        BASE.forEach(function(k){
            var l = AXES.indexOf("l" + k);
            var d = AXES.indexOf("d" + k);
            k = AXES.indexOf(k);
            if(mouseState.axes[l]){
                mouseState.axes[d] = mouseState.axes[k] - mouseState.axes[l];
            }
            mouseState.axes[l] = mouseState.axes[k];
        });
        this.checkDevice(mouseState);
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

    DOMelement.requestPointerLock = DOMelement.requestPointerLock
        || DOMelement.webkitRequestPointerLock
        || DOMelement.mozRequestPointerLock;

    this.requestPointerLock = function(){
        if(!this.isPointerLocked()){
            DOMelement.requestPointerLock();
        }
    }

    document.exitPointerLock = document.exitPointerLock
        || document.webkitExitPointerLock
        || document.mozExitPointerLock;

    this.exitPointerLock = document.exitPointerLock.bind(document);

    function isLocked(){
        return document.pointerLockElement === DOMelement
            || document.webkitPointerLockElement === DOMelement
            || document.mozPointerLockElement === DOMelement;
    };

    this.isPointerLocked = isLocked;

    function setLocation(x, y){
        mouseState.axes[0] = x;
        mouseState.axes[1] = y;
    }

    function setMovement(dx, dy){
        mouseState.axes[0] += dx;
        mouseState.axes[1] += dy;
    }

    function readMeta(event){
        META.forEach(function(m){
            mouseState[m] = event[m + "Key"];
        });
    }

    function readEvent(event){
        this.inPhysicalUse = true;
        if(isLocked()){
            setMovement(
                event.webkitMovementX || event.mozMovementX || event.movementX || 0,
                event.webkitMovementY || event.mozMovementY || event.movementY || 0);
        }
        else{
            setLocation(event.clientX, event.clientY);
        }
        readMeta(event);
    }

    window.addEventListener("keydown", readMeta, false);

    window.addEventListener("keyup", readMeta, false);

    window.addEventListener("mousedown", function(event){
        mouseState.buttons[event.button] = {
            pressed: true,
            values: 1
        };
        readEvent.call(this, event);
    }.bind(this), false);

    window.addEventListener("mouseup", function(event){
        mouseState.buttons[event.button] = {
            pressed: false,
            values: 0
        };
        readEvent.call(this, event);
    }.bind(this), false);

    window.addEventListener("mousemove", function(event){
        readEvent.call(this, event);
    }.bind(this), false);

    window.addEventListener("mousewheel", function(event){
        readEvent.call(this, event);
        mouseState.axes[2] += event.wheelDelta;
    }.bind(this), false);
}

inherit(MouseInput, NetworkedInput);