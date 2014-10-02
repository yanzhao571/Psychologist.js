function GamepadInput(name, axisConstraints, commands, socket, oscope, gpid){
    ButtonAndAxisInput.call(this, name, axisConstraints, commands, socket, oscope, 1, GamepadInput.AXES, true);
    var connectedGamepads = [],
        listeners = {
            gamepadconnected: [],
            gamepaddisconnected: []
        };

    this.superUpdate = this.update;

    this.checkDevice = function(pad){
        for(var i = 0; i < pad.buttons.length; ++i){
            this.setButton(i, pad.buttons[i].pressed);
        }
        for(var i = 0; i < pad.axes.length; ++i){
            this.setAxis(GamepadInput.AXES[i], pad.axes[i]);
        }
    }
    
    this.update = function(dt){
        var pads,
            currentPads = [];

        if(navigator.getGamepads){
            pads = navigator.getGamepads();
        }
        else if(navigator.webkitGetGamepads){
            pads = navigator.webkitGetGamepads();
        }
        
        if(pads){
            for(var i = 0; i < pads.length; ++i){
                var pad = pads[i];
                if(pad){
                    if(connectedGamepads.indexOf(pad.id) == -1){
                        connectedGamepads.push(pad.id);
                        onConnected(pad.id);
                    }
                    if(pad.id == gpid){
                        this.checkDevice(pad);
                    }
                    currentPads.push(pad.id);
                }
            }
        }

        for(var i = connectedGamepads.length - 1; i >= 0; --i){
            if(currentPads.indexOf(connectedGamepads[i]) == -1){
                onDisconnected(connectedGamepads[i]);
                connectedGamepads.splice(i, 1);
            }
        }
        
        this.superUpdate(dt);
    };

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
        for(var i = 0; i < arr.length; ++i){
            arr[i](id);
        }
    }

    function onConnected(id){
        sendAll(listeners.gamepadconnected, id);
    }

    function onDisconnected(id){
        sendAll(listeners.gamepaddisconnected, id);
    }

    this.getErrorMessage = function(){
        return errorMessage;
    };

    this.setGamepad = function(id){
        gpid = id;
        this.inPhysicalUse = true;
    };

    this.clearGamepad = function(){
        gpid = null;
        this.inPhysicalUse = false;
    };

    this.isGamepadSet = function(){
        return !!gpid;
    };

    this.getConnectedGamepads = function(){
        return connectedGamepads.slice();
    };
    
    this.addEventListener = function(event, handler, bubbles){
        if(event == "gamepadconnected"){
            if(listeners[event]){
                add(listeners[event], handler);
            }
            connectedGamepads.forEach(onConnected);
        }
    };

    this.removeEventListener = function(event, handler, bubbles){
        if(listeners[event]){
            remove(listeners[event], handler);
        }
    };


    try{
        this.update(0);
        available = true;
    }
    catch(err){
        avaliable = false;
        errorMessage = err;
    }
}

inherit(GamepadInput, ButtonAndAxisInput);
GamepadInput.AXES = ["LSX", "LSY", "RSX", "RSY"];
ButtonAndAxisInput.fillAxes(GamepadInput);

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