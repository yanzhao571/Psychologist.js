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

var META = ["ctrl", "shift", "alt", "meta"];
function NetworkedInput(name, commands, socket, offset){
    var commandState = {};
    this.inPhysicalUse = false;
    offset = offset || 0;
    
    function maybeClone(arr){ return (arr && arr.slice()) || []; }

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
            meta: maybeClone(cmd.meta),
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
    

    this.isDown = function(name){
        return commandState[name] && commandState[name].pressed;
    };

    this.isUp = function(name){
        return commandState[name] && !commandState[name].pressed;
    };

    this.getValue = function(name){
        return commandState[name] && commandState[name].value || 0;
    };

    function fireCommands(){
        commands.forEach(function(cmd){
            if(cmd.commandDown && commandState[cmd.name].pressed && commandState[cmd.name].fireAgain){
                cmd.commandDown();
                commandState[cmd.name].lt = Date.now();
            }

            if(cmd.commandUp && !commandState[cmd.name].pressed && commandState[cmd.name].wasPressed){
                cmd.commandUp();
            }
        });
    }

    if(socket){
        socket.on(name, function(cmdState){
            commandState = cmdState
            fireCommands();
        });
    }

    this.checkDevice = function(deviceState){
        if(this.inPhysicalUse){
            var prevState = "", finalState = "", t = Date.now();
            if(socket){
                prevState = JSON.stringify(commandState);
            }

            commands.forEach(function(cmd){
                commandState[cmd.name].wasPressed = commandState[cmd.name].pressed;
                commandState[cmd.name].fireAgain = (t - commandState[cmd.name].lt) >= cmd.dt;
                var metaSet = true, pressed, value;
                
                for(var n = 0; n < cmd.meta.length && metaSet; ++n){
                    var i = cmd.meta[n];
                    var sign = i > 0;
                    i = Math.abs(i) - offset;
                    metaSet &= deviceState[META[i]] && !sign || !deviceState[META[i]] && sign;
                }

                commandState[cmd.name].pressed = pressed = metaSet;
                commandState[cmd.name].value = value = 0;
                if(metaSet){
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
            });

            if(socket){
                finalState = JSON.stringify(commandState);
            }
            if(finalState != prevState){
                socket.emit(name, commandState);
            }

            fireCommands();
        }
    };
}

META.forEach(function(m, i){
    NetworkedInput[m] = i;
});