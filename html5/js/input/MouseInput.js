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

/*
    Class: MouseInput
        
        Listens for gamepads and specific button presses and executes the associated command for each.

    Constructor: new MouseInput(commands, gamepadIDs?);

        The `commands` parameter specifies a button tied to callbacks that will be called when the button 
        is depressed. Each callback can be associated with multiple buttons, to be able to provide 
        multiple options for the same command.

        Each buttons entry is a simple object following the pattern:
        
        {
            "name": "unique identifier", // e.g. "UP"
            "buttons": [idx1],
            "metaKeys": [0, 1, etc],
            "axes": [idx1],
            "commandDown" (optional): <callbackFunction>,
            "dt" (optional): <number>, //in milliseconds
            "commandUp" (optional): <callbackFunction>
        }

            The `name` property is a unique identifier that can be used for checking the `isDown()`
                and `isUp()` methods later.

            The `button` property is a button index for which MouseInput will listen. A negated 
                button index will instruct MouseInput to check the logical negation of the button's
                pressed value.

            The `metaKeys` property is an array of key-names for which MouseInput will
                will check are combined with the button.
        
            The `commandDown` property is the callback function that will be executed when the button
                is depressed. Depressing any of the other buttons in the list will result in additional 
                firings of the command. It takes no parameters.

            The `dt` property specifies the number of milliseconds to allow to lapse between calls
                to `commandDown` while the button is depressed. If `dt` is not specified, then only
                the first press of the button fires the event.

            The `commandUp` property is the callback function that will be executed when the button
                is released. It takes no parameters.

        The optional `DOMelement` parameter is a DOM element on which to lock the pointer, if locking later
            gets requested.

    Instance Methods:
        `isDown(name)`: returns true of the selected command name is activated. Returns false if
            none of the associated buttons are currently being depressed. This only works for buttons.

        `isUp(name)`: returns the boolean negation of `isDown()`. This only works for buttons.

        `getValue(name)`: returns the floating point "value" of the given command, for use with 
            joystick axes and analog buttons. Returns the MAX of all of the values, if more than one
            button/axis is being used to activate a command.

        `requestPointerLock()`:

        `exitPointerLock()`:

        `isPointerLocked()`:

        `addEventListener(event, handler, bubbles?)`: 

            Parameters:
            `event`: the name of the event to listen for. The only supported values are:

                "pointerlockchange": 

            `handler`: a callback function that receives information about the gamepad.

            optional `bubbles`: unused, only presented to maintain interface compatability with the standard
                addEventListener method for DOM elements.

        `removeEventListener(event, handler, bubbles?)`: get rid of a specific event handler for a specific event.

*/
function MouseInput(commands, DOMelement, socket){
    DOMelement = DOMelement || document.documentElement;
    var mouseState = {
            0:false, 1: false, 2: false,
            x: 0, y: 0, z: 0,
            dx: 0, dy: 0, dz: 0,
            alt: false, ctrl: false, meta: false, shift: false
        },
        commandState = {},
        AXES = ["x", "y", "z", "dx", "dy", "dz"],
        META = ["ctrl", "shift", "alt", "meta"],
        listeners = {
            pointerlockchanged: []
        }, t, sign;

    this.isDown = function(name){
        return commandState[name] && commandState[name].pressed;
    };

    this.isUp = function(name){
        return !this.isDown(name);
    };

    this.getValue = function(name){
        return commandState[name] && commandState[name].value;
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

    this.update = function(){
        t = Date.now();
        commands.forEach(function(cmd){
            var wasPressed = commandState[cmd.name].pressed,
                fireAgain = (t - cmd.lt) >= cmd.dt;

            commandState[cmd.name].pressed = cmd.buttons.map(function(i){
                sign = i < 0 ? true : false;
                i = Math.abs(i);
                return mouseState[i-1] ^ sign;
            }).concat(cmd.meta.map(function(i){
                sign = i < 0 ? true : false;
                i = Math.abs(i);
                return mouseState[META[i-1]] ^ sign;
            })).reduce(function(a, b){ return a & b; }, true);

            commandState[cmd.name].value = cmd.axes.map(function(i){
                sign = i < 0 ? -1 : 1;
                i = Math.abs(i);
                return sign * mouseState[AXES[i-1]];
            }).concat(cmd.meta.map(function(i){
                sign = i < 0 ? -1 : 1;
                i = Math.abs(i);
                return motionState[META[i-1]] ? sign : 0;
            })).reduce(function(a, b){ return a * b; }, 1);

            if(cmd.commandDown && commandState[cmd.name].pressed && fireAgain){
                cmd.commandDown();
                cmd.lt = t;
            }

            if(cmd.commandUp && !commandState[cmd.name].pressed && wasPressed){
                cmd.commandUp();
            }
        });
        mouseState.dx = mouseState.dy = mouseState.dz = 0;
    };

    function maybeClone(arr){
        return (arr && arr.slice()) || [];
    }

    // clone the arrays, so the consumer can't add elements to it in their own code.
    commands = commands.map(function(cmd){
        commandState[cmd.name] = {pressed: false, value: 0};
        return {
            name: cmd.name,
            buttons: maybeClone(cmd.buttons),
            axes: maybeClone(cmd.axes),
            meta: maybeClone(cmd.meta),
            lt: Date.now(),
            dt: cmd.dt,
            commandDown: cmd.commandDown,
            commandUp: cmd.commandUp
        };
    });

    function setLocation(x, y){
        mouseState.dx = x - mouseState.x;
        mouseState.dy = y - mouseState.y;
        mouseState.x = x;
        mouseState.y = y;
    }

    function setMovement(dx, dy){
        mouseState.dx = dx;
        mouseState.dy = dy;
        mouseState.x += dx;
        mouseState.y += dy;
    }

    function readMeta(event){
        META.forEach(function(m){
            mouseState[m] = event[m + "Key"];
        });
    }

    function readEvent(event){
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
        mouseState[event.button] = true;
        readEvent.call(this, event);
    }.bind(this), false);

    window.addEventListener("mouseup", function(event){
        mouseState[event.button] = false;
        readEvent.call(this, event);
    }.bind(this), false);

    window.addEventListener("mousemove", function(event){
        readEvent.call(this, event);
    }.bind(this), false);

    window.addEventListener("mousewheel", function(event){
        readEvent.call(this, event);
        mouseState.dz = event.wheelDelta;
        mouseState.z += mouseState.dz;
    }.bind(this), false);
}