function NetworkedInput(name, axisConstraints, commands, socket, offset, deltaTrackedAxes, integrateOnly){
    var numAxes = 0,
        enabled = true,
        transmitting = true,
        receiving = true,
        socketReady = false;

    
    if(deltaTrackedAxes instanceof Array){
        numAxes = deltaTrackedAxes.length;
    }
    
    axisConstraints = axisConstraints || [];
    deltaTrackedAxes = deltaTrackedAxes || [];
    offset = offset || 0;

    var commandState = {},
        deviceState = {
            buttons: [],
            axes: [],
        },
        metaKeys = ["ctrl", "shift", "alt", "metaKeys"],
        axisNames = [];
        inPhysicalUse = false;
    
    for(var y = 0; y < NetworkedInput.AXES_MODIFIERS.length; ++y){
        if(!(integrateOnly && NetworkedInput.AXES_MODIFIERS[y] == "D")){
            for(var x = 0; x < deltaTrackedAxes.length; ++x){
                axisNames.push(NetworkedInput.AXES_MODIFIERS[y] + deltaTrackedAxes[x]);
            }
        }
    }

    axisConstraints = axisConstraints.reduce(function(m, o){
        m[o.axis - 1] = {
            scale: o.scale,
            offset: o.offset,
            min: o.min,
            max: o.max,
            deadzone: o.deadzone
        }
        return m;
    }, new Array(axisNames.length));

    axisNames.forEach(function(axis, index){
        if(!axisConstraints[index]){
            axisConstraints[index] = {};
        }
    });

    function readMetaKeys(event){ 
        for(var i = 0; i < metaKeys.length; ++i){
            var m = metaKeys[i];
            deviceState[m] = event[m + "Key"]; 
        }
    }

    function fireCommands(fromNetwork){
        for(var i = 0; i < commands.length; ++i){
            var cmd = commands[i];
            if(cmd.commandDown && commandState[cmd.name].pressed && commandState[cmd.name].fireAgain){
                commandState[cmd.name].lt -= cmd.dt;
                cmd.commandDown();
            }

            if(cmd.commandUp && !commandState[cmd.name].pressed && commandState[cmd.name].wasPressed){
                cmd.commandUp();
            }
        }
    }

    function getAxis(name){
        var index = axisNames.indexOf(name),
            value = deviceState.axes[index] || 0,
            con = axisConstraints[index];
        if(con){
            if(con.scale != null){
                value *= con.scale;
            }
            if(con.offset != null){
                value -= con.offset;
            }
            if(con.min != null){
                value = Math.max(con.min, value);
            }
            if(con.max != null){
                value = Math.min(con.max, value);
            }
            if(con.deadzone != null && Math.abs(value) < con.deadzone){
                value = 0;
            }
        }
        return value;
    }

    this.zeroAxes = function(){
        for(var i = 0; i < axisNames.length; ++i){
            axisConstraints[i].offset = deviceState.axes[i];
        }
    };

    this.setAxis = function(name, value){
        inPhysicalUse = true;
        deviceState.axes[axisNames.indexOf(name)] = value;
    };

    this.incAxis = function(name, value){
        inPhysicalUse = true;
        deviceState.axes[axisNames.indexOf(name)] += value;
    };

    this.enable = function(v){
        enabled = v;
    };

    this.isEnabled = function(){
        return enabled;
    };

    this.transmit = function(v){
        transmitting = v;
    };

    this.isTransmitting = function(){
        return transmitting;
    };

    this.receive = function(v){
        receiving = v;
    };

    this.isReceiving = function(){
        return receiving;
    };

    this.setButton = function(index, pressed){
        inPhysicalUse = true;
        deviceState.buttons[index] = pressed;
    };    

    this.isDown = function(name){
        return (enabled || receiving) && commandState[name] && commandState[name].pressed;
    };

    this.isUp = function(name){
        return (enabled || receiving) && commandState[name] && !commandState[name].pressed;
    };

    this.getValue = function(name){
        return (enabled || receiving) && commandState[name] && commandState[name].value || 0;
    };

    this.update = function(dt){
        if(inPhysicalUse && enabled){
            var prevState = "", finalState = "";
            if(socketReady && transmitting){
                prevState = makeStateSnapshot();
            }

            for(var n = 0; n < deltaTrackedAxes.length; ++n){
                var a = deltaTrackedAxes[n];
                var av = getAxis(a);
                var i = "I" + a;
                var iv = getAxis(i);
                if(integrateOnly){
                    this.setAxis(i, iv + av * dt);
                }
                else{
                    var d = "D" + a;
                    var dv = getAxis(d);
                    var l = "L" + a;
                    var lv = getAxis(l);
                    if(lv){
                        this.setAxis(d, av - lv);
                    }
                    if(dv){
                        this.setAxis(i, iv + dv * dt);
                    }
                    this.setAxis(l, av);
                }
            }
            
            for(var c = 0; c < commands.length; ++c){
                var cmd = commands[c];
                commandState[cmd.name].wasPressed = commandState[cmd.name].pressed;
                commandState[cmd.name].lt += dt;
                commandState[cmd.name].fireAgain = commandState[cmd.name].lt >= cmd.dt;
                var metaKeysSet = true, pressed, value;
                
                for(var n = 0; n < cmd.metaKeys.length && metaKeysSet; ++n){
                    var m = cmd.metaKeys[n];
                    metaKeysSet = metaKeysSet && (deviceState[metaKeys[m.index]] && m.toggle || !deviceState[metaKeys[m.index]] && !m.toggle);
                }

                commandState[cmd.name].pressed = pressed = metaKeysSet;
                commandState[cmd.name].value = value = 0;
                if(metaKeysSet){
                    for(var n = 0; n < cmd.buttons.length; ++n){
                        var b = cmd.buttons[n];
                        var p = !!deviceState.buttons[b.index];
                        var v = p ? b.sign : 0;
                        pressed = pressed && (p && !b.toggle || !p && b.toggle);
                        if(Math.abs(v) > Math.abs(value)){
                            value = v;
                        }
                    }

                    for(var n = 0; n < cmd.axes.length; ++n){
                        var a = cmd.axes[n];
                        var v = a.sign * getAxis(axisNames[a.index]);
                        if(cmd.deadzone && Math.abs(v) < cmd.deadzone){
                            v = 0;
                        }
                        else if(Math.abs(v) > Math.abs(value)){
                            value = v;
                        }
                    }

                    commandState[cmd.name].pressed = pressed;
                    if(cmd.scale != null){
                        value *= cmd.scale;
                    }
                    commandState[cmd.name].value = value;
                }
            }

            if(socketReady && transmitting){
                finalState = makeStateSnapshot();
                if(finalState != prevState){
                    socket.emit(name, commandState);
                }
            }

            fireCommands(false);
        }
    };

    function makeStateSnapshot(){
        var state = name;
        for(var i = 0; i < commands.length; ++i){
            var cmd = commands[i];
            var stt = commandState[cmd.name];
            if(stt){
                state += fmt("[$1:$2:$3:$4]", cmd.name, stt.value, stt.pressed, stt.wasPressed, stt.fireAgain);
            }
        }
        return state;
    }    

    function maybeClone(arr){ 
        return ((arr && arr.slice()) || []).map(function(i){
            return {
                index: Math.abs(i) - offset,
                toggle: i < 0,
                sign: (i < 0) ? -1: 1
            }
        }); 
    }

    // clone the arrays, so the consumer can't add elements to it in their own code.
    commands = commands.map(function(cmd){
        commandState[cmd.name] = {
            value: 0,
            pressed: false,
            wasPressed: false,
            fireAgain: false,
            lt: 0
        };

        var newCmd = {
            name: cmd.name,
            deadzone: cmd.deadzone,
            axes: maybeClone(cmd.axes),
            scale: cmd.scale,
            buttons: maybeClone(cmd.buttons),
            metaKeys: maybeClone(cmd.metaKeys),
            dt: cmd.dt * 0.001,
            commandDown: cmd.commandDown,
            commandUp: cmd.commandUp,
        };

        for(var k in newCmd){
            if(newCmd[k] === undefined || newCmd[k] === null){
                delete newCmd[k];
            }
        }

        return newCmd;
    });

    if(socket){
        socket.on("userList", function(){
            socketReady = true;
        }.bind(this));
        socket.on(name, function(cmdState){
            if(receiving){
                inPhysicalUse = false;
                commandState = cmdState
                fireCommands(true);
            }
        }.bind(this));
        socket.on("deviceLost", function(){
            // will force the local event loop to take over and cancel out any lingering command activity
            inPhysicalUse = true;
        }.bind(this));
        socket.on("deviceAdded", function(){
            // local input activity could override this, but that is fine.
            inPhysicalUse = false;
        }.bind(this));
    }

    for(var i = 0; i < numAxes; ++i){
        deviceState.axes[i] = 0;
    }

    metaKeys.forEach(function(v){ deviceState[v] = false; });
    window.addEventListener("keydown", readMetaKeys, false);
    window.addEventListener("keyup", readMetaKeys, false);
}

NetworkedInput.AXES_MODIFIERS = ["", "I", "L", "D"];
NetworkedInput.fillAxes = function(classFunc){
    if(classFunc.AXES){
        for(var y = 0; y < this.AXES_MODIFIERS.length; ++y){
            for(var x = 0; x < classFunc.AXES.length; ++x){
                var name = (this.AXES_MODIFIERS[y] + classFunc.AXES[x]).toLocaleUpperCase();
                classFunc[name] = y * classFunc.AXES.length + x + 1;
            }
        }
    }
};

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
