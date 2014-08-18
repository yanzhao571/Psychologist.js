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
    Class: GamepadCommandInterface
        
        Listens for gamepads and specific button presses and executes the associated command for each.

    Constructor: new GamepadCommandInterface(commands, gamepadIDs?);

        The `commands` parameter specifies a button tied to callbacks that will be called when the button 
        is depressed. Each callback can be associated with multiple buttons, to be able to provide 
        multiple options for the same command.

        Each buttons entry is a simple object following the pattern:
        
        {
            "name": "unique identifier", // e.g. "UP"
            "button": idx1,
            "metaKeys": ["ctrlKey", "shiftKey"],
            "axis": axis
            "commandDown" (optional): <callbackFunction>,
            "dt" (optional): <number>, //in milliseconds
            "commandUp" (optional): <callbackFunction>
        }

            The `name` property is a unique identifier that can be used for checking the `isDown()`
                and `isUp()` methods later.

            The `button` property is a button index for which MouseCommandInterface will listen. A negated 
                button index will instruct MouseCommandInterface to check the logical negation of the button's
                pressed value.

            The `metaKeys` property is an array of key-names for which MouseCommandInterface will
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
function MouseCommandInterface(commands, DOMelement){
    var state = {
            0:false, 1: false, 2: false,
            x: 0, y: 0, z: 0,
            dx: 0, dy: 0, dz: 0,
            lx: 0, ly: 0, lz: 0,
            alt: false, ctrl: false, meta: false, shift: false
        },
        AXES = ["x", "y", "z", "dx", "dy", "dz", "lx", "ly", "lz"],
        META = ["alt", "ctrl", "meta", "shift"],
        isLocked = false,
        listeners = {
            pointerlockchanged: []
        };

    this.isDown = function(name){
        return state[name] && state[name].pressed;
    };

    this.isUp = function(name){
        return !this.isDown(name);
    };

    this.getValue = function(name){
        return state[name] && state[name].value;
    };
    
    this.addEventListener = function(event, handler, bubbles){
        if(event == "pointerlockchange"){
            document.addEventListener('pointerlockchange', handler, bubbles);
            document.addEventListener('mozpointerlockchange', handler, bubbles);
            document.addEventListener('webkitpointerlockchange', handler, bubbles);
        }
    };

    this.removeEventListener = function(event, handler, bubbles){
        if(event == "pointerlockchange"){
            document.removeEventListener('pointerlockchange', handler, bubbles);
            document.removeEventListener('mozpointerlockchange', handler, bubbles);
            document.removeEventListener('webkitpointerlockchange', handler, bubbles);
        }
    };

    DOMelement.requestPointerLock = DOMelement.requestPointerLock
        || DOMelement.webkitRequestPointerLock
        || DOMelement.mozRequestPointerLock;

    this.requestPointerLock = DOMelement.requestPointerLock.bind(DOMelement);

    document.exitPointerLock = document.exitPointerLock
        || document.webkitExitPointerLock
        || document.mozExitPointerLock;

    this.exitPointerLock = document.exitPointerLock.bind(document);

    this.isPointerLocked = function(){
        return document.pointerLockElement === DOMelement
            || document.webkitPointerLockElement === DOMelement
            || document.mozPointerLockElement === DOMelement;
    };

    this.update = function(){
        var t = Date.now();
        commands.forEach(function(cmd){
            var wasPressed = state[cmd.name].pressed,
                fireAgain = (t - cmd.lt) >= cmd.dt;
            state[cmd.name].value = 0;
            state[cmd.name].pressed = cmd.buttons.map(function(i){
                var sign = i < 0 ? true : false;
                i = Math.abs(i);
                return state[i-1] ^ sign;
            }).reduce(function(a, b){ return a & b; }, true);

            state[cmd.name].pressed &= cmd.meta.map(function(i){
                var sign = i < 0 ? true : false;
                i = Math.abs(i);
                return state[META[i-1]] ^ sign;
            }).reduce(function(a, b){ return a & b; }, true);

            state[cmd.name].value = cmd.axes.map(function(i){
                var sign = i < 0 ? -1 : 1;
                i = Math.abs(i);
                return sign * state[AXES[i-1]];
            }).reduce(function(a, b){ return Math.abs(a) > Math.abs(b) ? a : b; }, 0);

            if(cmd.commandDown && state[cmd.name].pressed && fireAgain){
                cmd.commandDown();
                cmd.lt = t;
            }

            if(cmd.commandUp && !state[cmd.name].pressed && wasPressed){
                cmd.commandUp();
            }
        });
    };

    function maybeClone(arr){
        return (arr && arr.slice()) || [];
    }

    // clone the arrays, so the consumer can't add elements to it in their own code.
    commands = commands.map(function(cmd){
        state[cmd.name] = {pressed: false, value: 0};
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
        state.lx = state.x;
        state.ly = state.y;
        state.x = x;
        state.y = y;
        state.dx = state.x - state.lx;
        state.dy = state.y - state.ly;
    }

    function setMovement(dx, dy){
        state.lx = state.x;
        state.ly = state.y;
        state.dx = dx;
        state.dy = dy;
        state.x += dx;
        state.y += dy;
    }

    function readEvent(evt){
        if(isLocked){
            setMovement(
                evt.webkitMovementX || evt.mozMovementX || evt.movementX || 0,
                evt.webkitMovementY || evt.mozMovementY || evt.movementY || 0);
        }
        else{
            setLocation(evt.clientX, evt.clientY);
        }
        META.forEach(function(m){
            state[m] = evt[m + "Key"];
        });
    }

    window.addEventListener("mousedown", function(event){
        state[event.button] = true;
        readEvent(event);
        //console.log(state);
    }, false);

    window.addEventListener("mouseup", function(event){
        state[event.button] = false;
        readEvent(event);
    }, false);

    window.addEventListener("mousemove", function(event){
        readEvent(event);
    }, false);

    window.addEventListener("mousewheel", function(event){
        readEvent(event);
        state.dz = event.wheelDelta;
        state.z += state.dz;
    }, false);
}