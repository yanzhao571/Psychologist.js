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
    Class: KeyboardInput
        
        Listens for specific key codes and executes the associated command for each
        keycode.

    Constructor: new KeyboardInput(commands, domElement?);

        The `commands` parameter specifies a collection of keycodes tied to callbacks
        that will be called when one of the keys are depressed. Each callback can
        be associated with multiple keycodes, to be able to provide multiple options
        for the same command.

        Each command entry is a simple object following the pattern:
        
        {
            "name": "unique identifier", // e.g. "UP"
            "buttons": [code1, code2, ..., code3], // e.g. [87, 38] for "W" and "Up Arrow"
            "dt": <number>, //in milliseconds
            "commandDown" (optional): <callbackFunction>,
            "commandUp" (optional): <callbackFunction>
        }

        The `name` property is a unique identifier that can be used for checking the `isDown()`
            and `isUp()` methods later.

        The `buttons` property is an array of numbers for which KeyboardInput will
            listen. If any of the numbers in the array matches matches the current keyCode, 
            the associated callbackFunction will be executed. It is named "buttons" instead of
            "keycodes" to mirror the other interface libraries being developed.

        The `dt` property specifies the number of milliseconds to allow to lapse between calls
            to `commandDown` while the key is depressed. If `dt` is not specified, then only
            the first press of the key fires the event.
        
        The `commandDown` property is the callback function that will be executed when the key
            is depressed. Depressing any of the other keys in the list will result in additional 
            firings of the command. It takes no parameters.

        The `commandUp` property is the callback function that will be executed when the key
            is released. It takes no parameters.

        The `domElement` optional parameter specifies to which DOMElement the key event
        listener will be attached. If none is specified, this value defaults to the document.


    Methods:
        `isDown(name)`: returns true of the specified command name is activated. Returns false if
            none of the associated keys are currently being depressed.

        `isUp(name)`: returns the boolean negation of `isDown()`.

*/
function KeyboardInput(commands, DOMElement){
    var keyState = { alt: false, ctrl: false, meta: false, shift: false },
        commandState = {},
        META = ["ctrl", "shift", "alt", "meta"];
    
    // clone the arrays, so the consumer can't add elements to it in their own code.
    commands = commands.map(function(cmd){
        commandState[cmd.name] = { pressed: false, value: 0 };
        cmd.buttons.forEach(function(b){ keyState[b] = false; });
        return {
            name: cmd.name,
            buttons: maybeClone(cmd.buttons),
            meta: maybeClone(cmd.meta),
            lt: Date.now(),
            dt: cmd.dt,
            commandDown: cmd.commandDown,
            commandUp: cmd.commandUp
        };
    });
    
    function maybeClone(arr){ return (arr && arr.slice()) || []; }

    function execute(stateChange, event){
        keyState[event.keyCode] = stateChange;
        META.forEach(function(m){
            keyState[m] = event[m + "Key"];
        });
    }

    this.update = function(){
        var t = Date.now();
        commands.forEach(function(cmd){
            var wasPressed = commandState[cmd.name],
                fireAgain = (t - cmd.lt) >= cmd.dt,
                metaSet = cmd.meta.map(function(i){
                    var sign = i > 0;
                    i = Math.abs(i);
                    return keyState[META[i-1]] ^ sign;
                }).reduce(function(a, b){ return a && b; }, true);

            commandState[cmd.name].pressed = metaSet && cmd.buttons.map(function(i){
                var sign = i < 0;
                i = Math.abs(i);
                return keyState[i-1] ^ sign;
            }).reduce(function(a, b){ return a && b; }, true);

            commandState[cmd.name].value = !metaSet ? 0 : cmd.buttons.map(function(i){
                var sign = i > 0 ? 1 : -1;
                i = Math.abs(i);
                return keyState[i-1] ? sign : 0;
            }).reduce(function(a, b){ return a * b; }, 1);

            if(cmd.commandDown && this.isDown(cmd.name) && fireAgain){
                cmd.commandDown();
                cmd.lt = t;
            }

            if(cmd.commandUp && this.isUp(cmd.name) && wasPressed){
                cmd.commandUp();
            }
        }.bind(this));
    };

    this.isDown = function(name){ return commandState[name].pressed; };
    this.isUp = function(name){ return !commandState[name].pressed; };
    this.getValue = function(name){ return commandState[name].value; };

    DOMElement = DOMElement || document;
    DOMElement.addEventListener("keydown", execute.bind(DOMElement, true), false);
    DOMElement.addEventListener("keyup", execute.bind(DOMElement, false), false);
}