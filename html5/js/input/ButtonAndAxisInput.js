function ButtonAndAxisInput(name, axisConstraints, commands, socket, oscope, offset, deltaTrackedAxes, integrateOnly){
    this.offset = offset || 0;
    NetworkedInput.call(this, name, commands, socket, oscope);
    this.inputState.axes = [];
    this.inputState.buttons = [];
    this.axisNames = [];
    this.commandNames = this.commands.map(function(c){ return c.name; });
    this.integrateOnly = !!integrateOnly;
    
    axisConstraints = axisConstraints || [];
    this.deltaTrackedAxes = deltaTrackedAxes || [];
    
    for(var y = 0; y < (integrateOnly ? 2 : 4); ++y){
        for(var x = 0; x < deltaTrackedAxes.length; ++x){
            this.axisNames.push(ButtonAndAxisInput.AXES_MODIFIERS[y] + deltaTrackedAxes[x]);
        }
    }

    this.axisConstraints = axisConstraints.reduce(function(m, o){
        m[o.axis - 1] = {
            scale: o.scale,
            offset: o.offset,
            min: o.min,
            max: o.max,
            deadzone: o.deadzone
        };
        return m;
    }, new Array(this.axisNames.length));

    this.axisNames.forEach(function(axis, index){
        if(!this.axisConstraints[index]){
            this.axisConstraints[index] = {};
        }
    }.bind(this));    

    for(var i = 0; i < this.axisNames.length; ++i){
        this.inputState.axes[i] = 0;
    }

    this.setDeadzone = this.setProperty.bind(this, "deadzone");
    this.setScale = this.setProperty.bind(this, "scale");
    this.setDT = this.setProperty.bind(this, "dt");
            
    this.addMetaKey = this.addToArray.bind(this, "metaKeys");
    this.addAxis = this.addToArray.bind(this, "axes");
    this.addButton = this.addToArray.bind(this, "buttons");       
    
    this.removeMetaKey = this.removeFromArray.bind(this, "metaKeys");
    this.removeAxis = this.removeFromArray.bind(this, "axes");
    this.removeButton = this.removeFromArray.bind(this, "buttons");

    this.invertAxis = this.invertInArray.bind(this, "axes");
    this.invertButton = this.invertInArray.bind(this, "buttons");
    this.invertMetaKey = this.invertInArray.bind(this, "metaKeys");
}

inherit(ButtonAndAxisInput, NetworkedInput);

ButtonAndAxisInput.AXES_MODIFIERS = ["", "I", "L", "D"];
ButtonAndAxisInput.fillAxes = function(classFunc, integrateOnly){
    if(classFunc.AXES){
        for(var y = 0; y < (integrateOnly ? 2 : 4); ++y){
            for(var x = 0; x < classFunc.AXES.length; ++x){
                var name = (this.AXES_MODIFIERS[y] + classFunc.AXES[x]).toLocaleUpperCase();
                classFunc[name] = y * classFunc.AXES.length + x + 1;
            }
        }
    }
};

ButtonAndAxisInput.prototype.preupdate = function(dt){
    for(var n = 0; n < this.deltaTrackedAxes.length; ++n){
        var a = this.deltaTrackedAxes[n];
        var i = "I" + a;
        var l = "L" + a;
        var d = "D" + a;
        
        var av = this.getAxis(a);
        if(this.integrateOnly){
            this.incAxis(i, av * dt);
        }
        else{
            var lv = this.getAxis(l);
            if(lv){
                this.setAxis(d, av - lv);
            }
            
            var dv = this.getAxis(d);
            if(dv){
                this.incAxis(i, dv * dt);
            }
            
            this.setAxis(l, av);
        }
    }
};

ButtonAndAxisInput.prototype.getAxis = function(name){
    var index = this.axisNames.indexOf(name),
        value = this.inputState.axes[index] || 0,
        con = this.axisConstraints[index];
    if(con){
        if(con.scale){
            value *= con.scale;
        }
        if(con.offset){
            value -= con.offset;
        }
        if(con.min){
            value = Math.max(con.min, value);
        }
        if(con.max){
            value = Math.min(con.max, value);
        }
        if(con.deadzone && Math.abs(value) < con.deadzone){
            value = 0;
        }
    }
    return value;
};

ButtonAndAxisInput.prototype.zeroAxes = function(){
    for(var i = 0; i < this.axisNames.length; ++i){
        this.axisConstraints[i].offset = this.inputState.axes[i];
    }
};

ButtonAndAxisInput.prototype.setAxis = function(name, value){
    this.inPhysicalUse = true;
    this.inputState.axes[this.axisNames.indexOf(name)] = value;
};

ButtonAndAxisInput.prototype.incAxis = function(name, value){
    this.setAxis(name, this.getAxis(name) + value);
};
    
ButtonAndAxisInput.prototype.setButton = function(index, pressed){
    this.inPhysicalUse = true;
    this.inputState.buttons[index] = pressed;
};    

ButtonAndAxisInput.prototype.getValue = function(name){
    var i = this.commandNames.indexOf(name);
    return ((this.enabled || (this.receiving && this.socketReady))
        && i > -1
        && !this.commands[i].disabled
        && this.commandState[name]
        && this.commandState[name].value) || 0;
};

ButtonAndAxisInput.prototype.isDown = function(name){
    var i = this.commandNames.indexOf(name);
    return (this.enabled || (this.receiving && this.socketReady))
        && i > -1
        && !this.commands[i].disabled
        && this.commandState[name]
        && this.commandState[name].pressed;
};

ButtonAndAxisInput.prototype.isUp = function(name){
    var i = this.commandNames.indexOf(name);
    return (this.enabled || (this.receiving && this.socketReady))
        && i > -1
        && !this.commands[i].disabled
        && this.commandState[name]
        && !this.commandState[name].pressed;
};

ButtonAndAxisInput.prototype.maybeClone = function(arr){ 
    var output = [];
    if(arr){
        for(var i = 0; i < arr.length; ++i){
            output[i] = {
                index: Math.abs(arr[i]) - this.offset,
                toggle: arr[i] < 0,
                sign: (arr[i] < 0) ? -1: 1
            };
        }
    }
    return output; 
};

ButtonAndAxisInput.prototype.cloneCommand = function(cmd){
    return {
        name: cmd.name,
        disabled: !!cmd.disabled,
        dt: cmd.dt || 0,
        deadzone: cmd.deadzone || 0,
        threshold: cmd.threshold || 0,
        repetitions: cmd.repetitions || 1,
        scale: cmd.scale || 1,
        offset: cmd.offset || 0,
        axes: this.maybeClone(cmd.axes),
        buttons: this.maybeClone(cmd.buttons),
        metaKeys: this.maybeClone(cmd.metaKeys),
        commandDown: cmd.commandDown,
        commandUp: cmd.commandUp
    };
};

ButtonAndAxisInput.prototype.evalCommand = function(cmd, cmdState, metaKeysSet){
    if(metaKeysSet){
        var pressed = true, value = 0;

        if(cmd.buttons){
            for(var n = 0; n < cmd.buttons.length; ++n){
                var b = cmd.buttons[n];
                var p = !!this.inputState.buttons[b.index];
                var v = p ? b.sign : 0;
                pressed = pressed && (p && !b.toggle || !p && b.toggle);
                if(Math.abs(v) > Math.abs(value)){
                    value = v;
                }
            }
        }        
        
        if(cmd.axes){
            for(var n = 0; n < cmd.axes.length; ++n){
                var a = cmd.axes[n];
                var v = a.sign * this.getAxis(this.axisNames[a.index]);
                if(cmd.deadzone && Math.abs(v) < cmd.deadzone){
                    v = 0;
                }
                else if(Math.abs(v) > Math.abs(value)){
                    value = v;
                }
            }
        }
        
        value = value * cmd.scale + cmd.offset;

        if(cmd.threshold){
            pressed = pressed && (value > cmd.threshold);
        }

        cmdState.pressed = pressed;
        cmdState.value = value;
    }
};
