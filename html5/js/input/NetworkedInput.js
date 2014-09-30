function NetworkedInput(name, commands, socket){
    this.name = name;
    this.commands = commands.map(this.cloneCommand.bind(this));
    this.socket = socket;
    this.enabled = true;
    this.transmitting = true;
    this.receiving = true;
    this.socketReady = false;
    this.inPhysicalUse = true;
    this.inputState = {};
    this.commandState = {};

    if(socket){
        socket.on("userList", function(){
            this.socketReady = true;
        }.bind(this));
        socket.on(name, function(cmdState){
            if(this.receiving){
                this.inPhysicalUse = false;
                this.commandState = cmdState
                this.fireCommands(true);
            }
        }.bind(this));
        socket.on("deviceLost", function(name){
            if(this.name == name){
                this.inPhysicalUse = true;
            }
        }.bind(this));
        socket.on("deviceAdded", function(name){
            if(this.name == name){
                this.inPhysicalUse = false;
            }
        }.bind(this));
    }
}

NetworkedInput.prototype.update = function(dt){
    if(this.inPhysicalUse && this.enabled){
        var prevState = "", finalState = "";
        if(this.socketReady && this.transmitting){
            prevState = this.makeStateSnapshot();
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
            if(!cmd.disabled){
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

// We clone the commands to prevent the implementing programmer from munging with the state
// outside of the control of the handlers.
NetworkedInput.prototype.cloneCommand = function(command){
    var obj = {};
    for(var key in command){
        var val = command[key];
        if(val instanceof Array){
            val = val.slice();
        }
        obj[key] = val;    
    }
    return obj;
};

NetworkedInput.prototype.setProperty = function(key, name, value){
    for(var i = 0; i < this.commands.length; ++i){
        if(this.commands[i].name == name){
            this.commands[i][key] = value;
            break;
        }
    }
};

NetworkedInput.prototype.addToArray = function(key, name, value){
    for(var i = 0; i < this.commands.length; ++i){
        if(this.commands[i].name == name){
            this.commands[i][key].push(value);
            break;
        }
    }
};
    
NetworkedInput.prototype.removeFromArray = function(key, name, value){
    var n = -1;
    for(var i = 0; i < this.commands.length; ++i){
        var cmd = this.commands[i];
        var arr = cmd[key];
        n = arr.indexOf(value)
        if(cmd.name == name && n > -1){
            arr.splice(n, 1);
            break;
        }
    }
};
    
NetworkedInput.prototype.invertInArray = function(key, name, value){
    var n = -1;
    for(var i = 0; i < this.commands.length; ++i){
        var cmd = this.commands[i];
        var arr = cmd[key];
        if(cmd.name == name && (n = arr.indexOf(value)) > -1){
            arr[n] *= -1;
            break;
        }
    }
};

NetworkedInput.prototype.enable = function(k, v){
    if(v == null){
        v = k;
        k = null;
    }

    if(k){
        this.setProperty("disabled", k, !v);
    }
    else{
        this.enabled = v;
    }
};

NetworkedInput.prototype.transmit = function(v){
    this.transmitting = v;
};

NetworkedInput.prototype.receive = function(v){
    this.receiving = v;
};
