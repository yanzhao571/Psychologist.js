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

        The `commands` parameter specifies a collection of buttons an tied to callbacks
        that will be called when one of the buttons are depressed. Each callback can
        be associated with multiple buttons, to be able to provide multiple options
        for the same command.

        Each buttons entry is a simple object following the pattern:
        
        {
            "name": "unique identifier", // e.g. "UP"
            "buttons": [idx1, idx2, ..., idx3],
            "axes": [idx1, idx2, ..., idx3],
            "dt": <number>, //in milliseconds
            "commandDown" (optional): <callbackFunction>,
            "commandUp" (optional): <callbackFunction>
        }

            The `name` property is a unique identifier that can be used for checking the `isDown()`
                and `isUp()` methods later.

            The `buttons` property is an array of button indices for which GamepadCommandInterface will
                listen. If any of the numbers in the array matches matches a button that is pressed, 
                the associated callbackFunction will be executed. A negated button index will instruct
                GamepadCommandInterface to check the positive value's button, and negate the value
                for tracking analog button values.

            The `axes` property is an array of axis indicies for which GamepadCommandInterface will
                listen. Axes are only used with the getValue function. They do not trigger commandDown
                or commandUp events, as that notion doesn't really make sense for decimal values.

            The `dt` property specifies the number of milliseconds to allow to lapse between calls
                to `commandDown` while the button is depressed. If `dt` is not specified, then only
                the first press of the button fires the event.
        
            The `commandDown` property is the callback function that will be executed when the button
                is depressed. Depressing any of the other buttons in the list will result in additional 
                firings of the command. It takes no parameters.

            The `commandUp` property is the callback function that will be executed when the button
                is released. It takes no parameters.

        The optional `gamepadIDs` parameter is an array of identifier strings for controllers, if you
            already know what controllers you want to use (i.e. you have stored them as configuration
            values after the user selected them from a list.

    Instance Methods:
        `addGamepad(id)`: set a gamepad as being tracked. When the event is fired for a given pad, the 
            gamepad ID will be included as part of the event. If the gamepad is not connected, the gamepad
            will start being tracked as soon as it becomes available. If the gamepad is already being
            tracked, this has no effect.

        `removeGamepad(id)`: remove a gamepad object from being tracked. If the gamepad is disconnected,
            this will prevent the gamepad from being tracked again if it is ever reconnected. If the gamepad
            is not being tracked, this has no effect.

        `getGamepads()`: returns an array of gamepad IDs that are being tracked. Save this to localStorage
            and restore it on the next reload and you won't have to prompt the user to select their controller
            again! Or you could just always default the user to using the first gamepad, whatever.

        `isDown(id, name)`: returns true of the selected command name is activated. Returns false if
            none of the associated buttons are currently being depressed. This only works for buttons.

        `isUp(id, name)`: returns the boolean negation of `isDown()`. This only works for buttons.

        `getValue(id, name)`: returns the floating point "value" of the given command, for use with 
            joystick axes and analog buttons. Returns the MAX of all of the values, if more than one
            button/axis is being used to activate a command.

        `update()`: call from your game loop to poll the latest gamepad state.

        `getConnectedGamepads()`: returns information about the gamepads that are currently
            connected to the system, after the user has hit one of the buttons on the controller.

        `addEventListener(event, handler, bubbles?)`: be able to receive events about gamepad connections
            and disconnections.

            Parameters:
            `event`: the name of the event to listen for. The only supported values are:

                "gamepadconnected": a new controller appears to the browser. This is not literally when 
                    the gamepad is first connected. This event will fire again if you reload the browser.
                "gamepaddisconnected": a controller disappears from the browser. This is

            `handler`: a callback function that receives information about the gamepad.

            optional `bubbles`: unused, only presented to maintain interface compatability with the standard
                addEventListener method for DOM elements.

        `removeEventListener(event, handler, bubbles?)`: get rid of a specific event handler for a specific event.

            Parameters:
            `event`: the name of the event from which to remove.

            `handler`: a callback function to remove

            optional `bubbles`: ignored

        `isAvailable()`: returns true if the setup process was successful.

        `getErrorMessage()`: returns the Error object that occured when setup failed, or 
            null if setup was successful.
*/

function GamepadCommandInterface(commands, gamepads){
    var state = {},
        available = null,
        errorMessage = null,
        connectedGamepads = [],
        listeners = {
            gamepadconnected: [],
            gamepaddisconnected: []
        };

    function checkPad(pad){
        var n = Date.now();
        if(gamepads.indexOf(pad.id) > -1){
            var padState = state[pad.id];
            commands.forEach(function(cmd){
                var buttonPressed = false,
                    axisValue = 0.0,
                    fireAgain = cmd.dt && (n - cmd.lt) > cmd.dt;

                Array.prototype.forEach.call(pad.buttons, function(btn, i){
                    if(cmd.buttons.indexOf(i) > -1){
                        buttonPressed |= btn.pressed;
                        if(Math.abs(axisValue) < Math.abs(btn.value)){
                            axisValue = btn.value;
                        }
                    }
                    else if(cmd.buttons.indexOf(-i) > -1){
                        if(Math.abs(axisValue) < Math.abs(btn.value)){
                            axisValue = -btn.value;
                        }
                    }
                });

                Array.prototype.forEach.call(pad.axes, function(axis, i){
                    if(cmd.axes.indexOf(i) > -1 && Math.abs(axisValue) < Math.abs(axis)){
                        axisValue = axis;
                    }
                });

                if(cmd.deadzone && Math.abs(axisValue) < cmd.deadzone){
                    axisValue = 0;
                }
                padState[cmd.name].value = axisValue;

                if(cmd.commandDown && buttonPressed && (!padState[cmd.name].pressed || fireAgain)){
                    cmd.commandDown(pad.id);
                    cmd.lt = n;
                }
                
                if(cmd.commandUp && !buttonPressed && padState[cmd.name].pressed){
                    cmd.commandUp(pad.id);
                }
                padState[cmd.name].pressed = buttonPressed;
            });
        }
    }

    function add(arr, val){
        if(arr.indexOf(val) == -1){
            arr.push(val);
        }
    }

    function remove(arr, val){        
        var index = arr.indexOf(val);
        if(index > -1){
            arr.splice(index, 1);
        }
    }

    function sendAll(arr, id){
        arr.forEach(function(f){ f(id); });
    }

    function onConnected(id){
        sendAll(listeners.gamepadconnected, id);
    }

    function onDisconnected(id){
        sendAll(listeners.gamepaddisconnected, id);
    }

    this.isAvailable = function(){ 
        return available;
    };

    this.getErrorMessage = function(){
        return errorMessage;
    };

    this.addGamepad = function(id){
        add(gamepads, id);
    };

    this.removeGamepad = function(id){
        remove(gamepads, id);
    };

    this.getGamepads = function(){
        return gamepads.slice();
    };

    this.isDown = function(id, name){
        return state[id][name].pressed;
    };

    this.isUp = function(id, name){
        return !this.isDown(id, name);
    };

    this.getValue = function(id, name){
        return state[id] && state[id][name] && state[id][name].value;
    };

    this.getConnectedGamepads = function(){
        return connectedGamepads.slice();
    };
    
    this.addEventListener = function(event, handler, bubbles){
        if(listeners.hasOwnProperty(event)){
            add(listeners[event], handler);
        }
        if(event == "gamepadconnected"){
            connectedGamepads.forEach(onConnected);
        }
    };

    this.removeEventListener = function(event, handler, bubbles){
        if(listeners.hasOwnProperty(event)){
            remove(listeners[event], handler);
        }
    };

    this.update = function(){
        var pads = null,
            currentPads = null;

        if(navigator.getGamepads){
            pads = navigator.getGamepads();
        }
        else if(navigator.webkitGetGamepads){
            pads = navigator.webkitGetGamepads();
        }

        if(pads){
            pads = Array.prototype.filter.call(pads, function(pad){ return !!pad; });
        }
        else{
            pads = [];
        }

        currentPads = pads.map(function(pad){
            if(connectedGamepads.indexOf(pad.id) == -1){
                state[pad.id] = {};
                commands.forEach(function(cmd){
                    state[pad.id][cmd.name] = {
                        pressed: false,
                        value: 0.0
                    };
                });
                connectedGamepads.push(pad.id);
                onConnected(pad.id);
            }
            checkPad(pad);
            return pad.id;
        });

        for(var i = connectedGamepads.length - 1; i >= 0; --i){
            if(currentPads.indexOf(connectedGamepads[i]) == -1){
                onDisconnected(connectedGamepads[i]);
                delete state[connectedGamepads[i]];
                connectedGamepads.splice(i, 1);
            }
        }
    };

    // clone the arrays, so the consumer can't add elements to it in their own code.
    commands = commands.slice();
    if(gamepads){
        gamepads = gamepads.slice();
    }
    else{
        gamepads = [];
    }

    commands.forEach(function(cmd){
        if(cmd.buttons){
            cmd.buttons = cmd.buttons.slice();
        }
        else{
            cmd.buttons = [];
        }

        if(cmd.axes){
            cmd.axes = cmd.axes.slice();
        }
        else{
            cmd.axes = [];
        }

        if(cmd.dt){
            cmd.lt = Date.now();
        }
    });

    try{
//        this.update();
        available = true;
    }
    catch(err){
        avaliable = false;
        errorMessage = err;
    }
}