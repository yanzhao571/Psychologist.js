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

function NetworkedInput(name, commands, socket, offset, deltaTrackedAxes){
    offset = offset || 0;
    deltaTrackedAxes = deltaTrackedAxes || [];

    var commandState = {},
        deviceState = {
            buttons: [],
            axes: [],
        },
        metaKeys = ["ctrl", "shift", "alt", "metaKeys"],
        axisNames = deltaTrackedAxes
            .concat(deltaTrackedAxes.map(function(v){return "d" + v;}))
            .concat(deltaTrackedAxes.map(function(v){return "l" + v;})),
        inPhysicalUse = false;
    
    function readMetaKeys(event){ 
        for(var i = 0; i < metaKeys.length; ++i){
            var m = metaKeys[i];
            deviceState[m] = event[m + "Key"]; 
        }
    }

    function maybeClone(arr){ return (arr && arr.slice()) || []; }

    function fireCommands(){
        for(var i = 0; i < commands.length; ++i){
            var cmd = commands[i];
            if(cmd.commandDown && commandState[cmd.name].pressed && commandState[cmd.name].fireAgain){
                cmd.commandDown();
                commandState[cmd.name].lt = Date.now();
            }

            if(cmd.commandUp && !commandState[cmd.name].pressed && commandState[cmd.name].wasPressed){
                cmd.commandUp();
            }
        }
    }

    if(deltaTrackedAxes.length > 0){
        this.setAxis = function(name, value){
            inPhysicalUse = true;
            deviceState.axes[axisNames.indexOf(name)] = value;
        };

        this.incAxis = function(name, value){
            inPhysicalUse = true;
            deviceState.axes[axisNames.indexOf(name)] += value;
        };
    }
    else{
        this.setAxis = function(index, value){
            inPhysicalUse = true;
            deviceState.axes[index] = value;
        };

        this.incAxis = function(index, value){
            inPhysicalUse = true;
            deviceState.axes[index] += value;
        };
    }

    this.setButton = function(index, pressed){
        inPhysicalUse = true;
        deviceState.buttons[index] = {
            pressed: pressed,
            value: pressed ? 1 : 0
        };
    };    

    this.isDown = function(name){
        return commandState[name] && commandState[name].pressed;
    };

    this.isUp = function(name){
        return commandState[name] && !commandState[name].pressed;
    };

    this.getValue = function(name){
        return commandState[name] && commandState[name].value || 0;
    };

    this.update = function(){
        if(inPhysicalUse){
            var prevState = "", finalState = "", t = Date.now();
            if(socket){
                prevState = JSON.stringify(commandState);
            }

            for(var i = 0; i < deltaTrackedAxes.length; ++i){
                var d = i + deltaTrackedAxes.length;
                var l = i + deltaTrackedAxes.length * 2;
                if(deviceState.axes[l]){
                    deviceState.axes[d] = deviceState.axes[i] - deviceState.axes[l];
                }
                deviceState.axes[l] = deviceState.axes[i];
            }
            
            for(var c = 0; c < commands.length; ++c){
                var cmd = commands[c];
                commandState[cmd.name].wasPressed = commandState[cmd.name].pressed;
                commandState[cmd.name].fireAgain = (t - commandState[cmd.name].lt) >= cmd.dt;
                var metaKeysSet = true, pressed, value;
                
                for(var n = 0; n < cmd.metaKeys.length && metaKeysSet; ++n){
                    var i = cmd.metaKeys[n];
                    var sign = i > 0;
                    i = Math.abs(i) - offset;
                    metaKeysSet &= deviceState[metaKeys[i]] && !sign || !deviceState[metaKeys[i]] && sign;
                }

                commandState[cmd.name].pressed = pressed = metaKeysSet;
                commandState[cmd.name].value = value = 0;
                if(metaKeysSet){
                    for(var n = 0; n < cmd.buttons.length && pressed; ++n){
                        var i = cmd.buttons[n];
                        sign = i < 0 ? true : false;
                        i = Math.abs(i) - offset;
                        var p = deviceState.buttons[i] && deviceState.buttons[i].pressed;
                        pressed = pressed && (p && !sign || !p && sign);
                    }
                    commandState[cmd.name].pressed = pressed;

                    for(var n = 0; n < cmd.axes.length; ++n){
                        var i = cmd.axes[n];
                        sign = i < 0 ? -1 : 1;
                        i = Math.abs(i) - offset;
                        var v = sign * deviceState.axes[i];
                        if(cmd.deadzone && Math.abs(v) < cmd.deadzone){
                            v = 0;
                        }
                        else if(Math.abs(v) > Math.abs(value)){
                            value = v;
                        }
                    }
                    
                    for(var n = 0; n < cmd.buttons.length; ++n){
                        var i = cmd.buttons[n];
                        sign = i < 0 ? -1 : 1;
                        i = Math.abs(i) - offset;
                        var v = sign * ((deviceState.buttons[i] && deviceState.buttons[i].value) || 0);
                        if(cmd.deadzone && Math.abs(v) < cmd.deadzone){
                            v = 0;
                        }                      
                        else if(Math.abs(v) > Math.abs(value)){
                            value = v;
                        }
                    }                    
                    commandState[cmd.name].value = value;
                }
            }

            if(socket){
                finalState = JSON.stringify(commandState);
            }
            if(finalState != prevState){
                socket.emit(name, commandState);
            }

            fireCommands();
        }
    };   
    

    // clone the arrays, so the consumer can't add elements to it in their own code.
    commands = commands.map(function(cmd){
        commandState[cmd.name] = {
            value: 0,
            pressed: false,
            wasPressed: false,
            fireAgain: false,
            lt: Date.now()
        };

        var newCmd = {
            name: cmd.name,
            deadzone: cmd.deadzone,
            axes: maybeClone(cmd.axes),
            buttons: maybeClone(cmd.buttons),
            metaKeys: maybeClone(cmd.metaKeys),
            dt: cmd.dt,
            commandDown: cmd.commandDown,
            commandUp: cmd.commandUp
        };

        for(var k in newCmd){
            if(newCmd[k] === undefined || newCmd[k] === null){
                delete newCmd[k];
            }
        }

        return newCmd;
    });

    if(socket){
        socket.on(name, function(cmdState){
            commandState = cmdState
            fireCommands();
        });
    }

    metaKeys.forEach(function(v){ deviceState[v] = false; });
    axisNames.forEach(function(v, i){ deviceState.axes[i] = 0; });
    window.addEventListener("keydown", readMetaKeys, false);
    window.addEventListener("keyup", readMetaKeys, false);
}