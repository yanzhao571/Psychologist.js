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
function KeyboardInput(commands, domElement){
    var state = {};

    function execute(stateChange, commandName, event){
        var candidates = commands.filter(function(cmd){ return cmd && cmd.buttons && cmd.buttons.indexOf && cmd.buttons.indexOf(event.keyCode) > -1;});
        if(candidates.length == 0){
            console.log(fmt("Unknown command: $1", event.keyCode));
        }
        else{
            var c = candidates[0];
            var n = Date.now();
            if(state[c.name] != stateChange 
                || c.dt && (n - c.lt) > c.dt){
                c.lt = n;
                state[c.name] = stateChange;
                if(c[commandName]){
                    c[commandName]();
                }
            }
        }
    }

    this.isDown = function(name){
        return state[name];
    };

    this.isUp = function(name){
        return !state[name];
    };
    
    // clone the arrays, so the consumer can't add elements to it in their own code.
    commands = commands.slice();
    
    commands.forEach(function(c){
        state[c.name] = false;
        if(c.dt){
            c.lt = Date.now();
        }
    });

    domElement = domElement || document;
    domElement.addEventListener("keydown", execute.bind(domElement, true, "commandDown"), false);
    domElement.addEventListener("keyup", execute.bind(domElement, false, "commandUp"), false);
}