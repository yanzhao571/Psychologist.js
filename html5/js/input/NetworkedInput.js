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
    

    function readMetaKeys(event){ 
        for(var i = 0; i < NetworkedInput.META_KEYS.length; ++i){
            var m = NetworkedInput.META_KEYS[i];
            this.inputState[m] = event[m + "Key"]; 
        }
    }
}

NetworkedInput.META_KEYS = ["ctrl", "shift", "alt", "metaKeys"];

NetworkedInput.prototype.preupdate = function(){};

NetworkedInput.prototype.update = function(dt){
    if(this.inPhysicalUse && this.enabled){
        var prevState = "", finalState = "";
        if(this.socketReady && this.transmitting){
            prevState = this.makeStateSnapshot();
        }

        this.preupdate();
            
        for(var c = 0; c < this.commands.length; ++c){
            var cmd = this.commands[c];
            var cmdState = this.commandState[cmd.name];
            if(!cmd.disabled){
                this.evalCommand(cmd, cmdState);
            }
        }

        if(socketReady && transmitting){
            finalState = this.makeStateSnapshot();
            if(finalState != prevState){
                socket.emit(name, commandState);
            }
        }

        fireCommands(false);
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