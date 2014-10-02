function NetworkedInput(name, commands, socket, oscope){
    this.name = name;
    this.commands = commands.map(this.cloneCommand.bind(this));
    this.socket = socket;
    this.oscope = oscope;
    this.enabled = true;
    this.transmitting = true;
    this.receiving = true;
    this.socketReady = false;
    this.inPhysicalUse = true;
    this.inputState = {};
    this.commandState = {};
    
    commands.forEach(function(cmd){
        return this.commandState[cmd.name] = {
            lt: 0,
            pressed: false,
            wasPressed: false,
            value: null,
            fireAgain: false
        };
    }.bind(this));

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

    function readMetaKeys(event){ 
        for(var i = 0; i < NetworkedInput.META_KEYS.length; ++i){
            var m = NetworkedInput.META_KEYS[i];
            this.inputState[m] = event[m + "Key"]; 
        }
    }
    
    NetworkedInput.META_KEYS.forEach(function(v){ this.inputState[v] = false; }.bind(this));
    window.addEventListener("keydown", readMetaKeys.bind(this), false);
    window.addEventListener("keyup", readMetaKeys.bind(this), false);
}

NetworkedInput.META_KEYS = ["ctrl", "shift", "alt", "meta"];
NetworkedInput.META_KEYS.forEach(function(key, index){
    NetworkedInput[key.toLocaleUpperCase()] = index + 1;
});

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
            if(!cmd.disabled && this.evalCommand(cmd, cmdState, dt)){
                break;
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
        if(cmd.commandDown && cmdState.pressed && cmdState.fireAgain){
            cmdState.lt -= cmd.dt;
            cmd.commandDown();
        }

        if(cmd.commandUp && !cmdState.pressed && cmdState.wasPressed){
            cmd.commandUp();
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
}

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