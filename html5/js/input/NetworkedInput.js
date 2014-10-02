function NetworkedInput(name, commands, socket, oscope){
    this.name = name;
    this.commandState = {};
    this.commands = [];
    this.socket = socket;
    this.oscope = oscope;
    this.enabled = true;
    this.transmitting = true;
    this.receiving = true;
    this.socketReady = false;
    this.inPhysicalUse = true;
    this.inputState = {};

    function readMetaKeys(event){ 
        for(var i = 0; i < NetworkedInput.META_KEYS.length; ++i){
            var m = NetworkedInput.META_KEYS[i];
            this.inputState[m] = event[m + "Key"]; 
        }
    }

    window.addEventListener("keydown", readMetaKeys.bind(this), false);
    window.addEventListener("keyup", readMetaKeys.bind(this), false);

    if(socket){
        socket.on("userList", function(){
            this.socketReady = true;
        }.bind(this));
        socket.on(name, function(cmdState){
            if(this.receiving){
                this.inPhysicalUse = false;
                this.commandState = cmdState;
                this.fireCommands();
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

    for(var i = 0; i < commands.length; ++i){
        var cmd = commands[i];
        this.commandState[cmd.name] = {
            value: null,
            pressed: false,
            wasPressed: false,
            fireAgain: false,
            lt: 0,
            repeatCount: 0
        };
        this.commands[i] = this.cloneCommand(cmd);
        this.commands[i].repetitions = this.commands[i].repetitions || 1;
    }
    
    for(var i = 0; i < NetworkedInput.META_KEYS.length; ++i){
        this.inputState[NetworkedInput.META_KEYS[i]] = false; 
    }
}

NetworkedInput.META_KEYS = ["ctrl", "shift", "alt", "meta"];
NetworkedInput.META_KEYS.forEach(function(key, index){
    NetworkedInput[key.toLocaleUpperCase()] = index + 1;
});

NetworkedInput.prototype.cloneCommand = function(cmd){ throw new Error("cloneCommand function must be defined in subclass"); };
NetworkedInput.prototype.preupdate = function(dt){};

NetworkedInput.prototype.update = function(dt){
    if(this.inPhysicalUse && this.enabled){
        var prevState = "", finalState = "";
        if(this.socketReady && this.transmitting){
            prevState = this.makeStateSnapshot();
        }

        this.preupdate(dt);

        for(var c = 0; c < this.commands.length; ++c){
            var cmd = this.commands[c];
            var cmdState = this.commandState[cmd.name];
            cmdState.wasPressed = cmdState.pressed;
            cmdState.pressed = false;
            if(!cmd.disabled){
                var metaKeysSet = true;        
    
                if(cmd.metaKeys){            
                    for(var n = 0; n < cmd.metaKeys.length && metaKeysSet; ++n){
                        var m = cmd.metaKeys[n];
                        metaKeysSet = metaKeysSet 
                            && (this.inputState[NetworkedInput.META_KEYS[m.index]] && m.toggle 
                                || !this.inputState[NetworkedInput.META_KEYS[m.index]] && !m.toggle);
                    }
                }

                cmdState.lt += dt;
                cmdState.fireAgain = cmdState.lt >= cmd.dt;
                this.evalCommand(cmd, cmdState, metaKeysSet, dt);
            }
        }

        if(this.socketReady && this.transmitting){
            finalState = this.makeStateSnapshot();
            if(finalState != prevState){
                this.socket.emit(this.name, this.commandState);
            }
        }

        this.fireCommands();
    }
};

NetworkedInput.prototype.fireCommands = function(){
    for(var i = 0; i < this.commands.length; ++i){
        var cmd = this.commands[i];
        var cmdState = this.commandState[cmd.name];

        if(cmdState.fireAgain){
            if(!cmdState.pressed && cmdState.wasPressed){
                ++cmdState.repeatCount;
                cmdState.ct = cmdState.lt;
            }

            if(cmdState.pressed){
                if(cmd.commandDown){
                    cmdState.lt = 0;
                    cmd.commandDown();
                }
            }
            else if(!cmdState.wasPressed && (cmdState.lt - cmdState.ct) >= cmd.dt){
                cmdState.repeatCount = 0;
            }

            if(cmd.commandUp && cmdState.repeatCount >= cmd.repetitions){
                cmd.commandUp();
                cmdState.lt = 0;
                cmdState.repeatCount = 0;
            }
        }
    }
};

NetworkedInput.prototype.makeStateSnapshot = function(){
    var state = this.name;
    for(var i = 0; i < this.commands.length; ++i){
        var cmd = this.commands[i];
        var cmdState = this.commandState[cmd.name];
        if(cmdState){
            state += fmt(
                "[$1:$2:$3:$4]", 
                cmd.name, 
                cmdState.value, 
                cmdState.pressed, 
                cmdState.wasPressed, 
                cmdState.fireAgain
            );
        }
    }
    return state;
};

NetworkedInput.prototype.getValue = function(name){
    return (this.enabled || this.receiving) && this.commandState[name] && this.commandState[name].value;
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

NetworkedInput.prototype.isEnabled = function(k){
    if(k){
        for(var i = 0; i < this.commands.length; ++i){
            if(this.commands[i].name == k){
                return !this.commands[i].disabled;
            }
        }
        return false;
    }
    else{
        return this.enabled;
    }
};

NetworkedInput.prototype.transmit = function(v){
    this.transmitting = v;
};

NetworkedInput.prototype.isTransmitting = function(){
    return this.transmitting;
};

NetworkedInput.prototype.receive = function(v){
    this.receiving = v;
};

NetworkedInput.prototype.isReceiving = function(){
    return this.receiving;
};