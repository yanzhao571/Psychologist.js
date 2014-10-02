function ButtonAndAxisInput(name, axisConstraints, commands, socket, oscope, offset, deltaTrackedAxes, integrateOnly){
    this.offset = offset || 0;
    NetworkedInput.call(this, name, commands, socket, oscope);
    this.inputState.axes = [];
    this.inputState.buttons = [];
    var numAxes = 0;
    this.axisNames = [];
    
    if(deltaTrackedAxes instanceof Array){
        numAxes = deltaTrackedAxes.length;
    }
    
    axisConstraints = axisConstraints || [];
    this.deltaTrackedAxes = deltaTrackedAxes || [];
    
    for(var y = 0; y < ButtonAndAxisInput.AXES_MODIFIERS.length; ++y){
        if(!(integrateOnly && ButtonAndAxisInput.AXES_MODIFIERS[y] == "D")){
            for(var x = 0; x < deltaTrackedAxes.length; ++x){
                this.axisNames.push(ButtonAndAxisInput.AXES_MODIFIERS[y] + deltaTrackedAxes[x]);
            }
        }
    }

    this.axisConstraints = axisConstraints.reduce(function(m, o){
        m[o.axis - 1] = {
            scale: o.scale,
            offset: o.offset,
            min: o.min,
            max: o.max,
            deadzone: o.deadzone
        }
        return m;
    }, new Array(this.axisNames.length));

    this.axisNames.forEach(function(axis, index){
        if(!this.axisConstraints[index]){
            this.axisConstraints[index] = {};
        }
    }.bind(this));    

    for(var i = 0; i < numAxes; ++i){
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
ButtonAndAxisInput.fillAxes = function(classFunc){
    if(classFunc.AXES){
        for(var y = 0; y < this.AXES_MODIFIERS.length; ++y){
            for(var x = 0; x < classFunc.AXES.length; ++x){
                var name = (this.AXES_MODIFIERS[y] + classFunc.AXES[x]).toLocaleUpperCase();
                classFunc[name] = y * classFunc.AXES.length + x + 1;
            }
        }
    }
};

ButtonAndAxisInput.prototype.getAxis = function(name){
    var index = this.axisNames.indexOf(name),
        value = this.inputState.axes[index] || 0,
        con = this.axisConstraints[index];
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
    this.inPhysicalUse = true;
    this.inputState.axes[this.axisNames.indexOf(name)] += value;
};
    
ButtonAndAxisInput.prototype.setButton = function(index, pressed){
    this.inPhysicalUse = true;
    this.inputState.buttons[index] = pressed;
};    

ButtonAndAxisInput.prototype.isDown = function(name){
    return (this.enabled || this.receiving) && this.commandState[name] && this.commandState[name].pressed;
};

ButtonAndAxisInput.prototype.isUp = function(name){
    return (this.enabled || this.receiving) && this.commandState[name] && !this.commandState[name].pressed;
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
        disabled: cmd.disabled,
        dt: cmd.dt,
        deadzone: cmd.deadzone,
        threshold: cmd.threshold,
        repetitions: cmd.repetitions,
        scale: cmd.scale,
        axes: this.maybeClone(cmd.axes),
        buttons: this.maybeClone(cmd.buttons),
        metaKeys: this.maybeClone(cmd.metaKeys),
        commandDown: cmd.commandDown,
        commandUp: cmd.commandUp
    };
};

ButtonAndAxisInput.prototype.evalCommand = function(cmd, cmdState, metaKeysSet, dt){
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

        if(cmd.scale != null){
            value *= cmd.scale;
        }

        if(cmd.threshold != null){
            pressed = pressed && (value > cmd.threshold);
        }

        cmdState.pressed = pressed;
        cmdState.value = value;
    }
};

ButtonAndAxisInput.prototype.preupdate = function(dt){
    for(var n = 0; n < this.deltaTrackedAxes.length; ++n){
        var a = this.deltaTrackedAxes[n];
        var av = this.getAxis(a);
        var i = "I" + a;
        var iv = this.getAxis(i);
        if(this.integrateOnly){
            this.setAxis(i, iv + av * dt);
        }
        else{
            var d = "D" + a;
            var dv = this.getAxis(d);
            var l = "L" + a;
            var lv = this.getAxis(l);
            if(lv){
                this.setAxis(d, av - lv);
            }
            if(dv){
                this.setAxis(i, iv + dv * dt);
            }
            this.setAxis(l, av);
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
