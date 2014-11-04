/*
https://www.github.com/capnmidnight/VR
Copyright (c) 2014 Sean T. McBeth
All rights reserved.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

VUI = window.VUI || {};

VUI.BUTTON_TEST_BOXING = 2;
    
VUI.ButtonFactory = function(templateFile, options){
    this.options = options;
    this.template = new ModelLoader(templateFile);
};

VUI.ButtonFactory.count = 0;

VUI.ButtonFactory.prototype.create = function(toggle){
    VUI.ButtonFactory.count = (VUI.ButtonFactory.count || 0) + 1;
    var name = "button" + VUI.ButtonFactory.count;
    var btn = new VUI.Button(this.template.clone(), name, this.options);
    btn.toggle = toggle;
    return btn;
};


VUI.Button = function(model, name, options){
    this.options = options || {};    
    for(var key in VUI.Button.DEFAULTS){
        this.options[key] = this.options[key] || VUI.Button.DEFAULTS[key];
    }
    this.options.minDeflection = Math.cos(this.options.minDeflection);
    this.options.colorUnpressed = new THREE.Color(this.options.colorUnpressed);
    this.options.colorPressed = new THREE.Color(this.options.colorPressed);
    
    this.listeners = { click: [] };
    this.base = model;
    this.position = this.base.position;
    this.rotation = this.base.rotation;
    this.name = name;
    this.cap = this.base.buttons[0];
    this.cap.name = name;
    this.rest = this.cap.position.clone();
    this.color = this.cap.children[0].material.materials[0].color;
    this.toggle = false;
    this.value = false;
    this.pressed = false;
    this.wasPressed = false;
    this.direction = new THREE.Vector3();
    this.testPoint = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster(this.testPoint, this.direction, 0, 1);
    delete this.base.buttons;
};

VUI.Button.DEFAULTS = {
    maxThrow: 0.1,
    minDeflection: 10,
    colorUnpressed: 0x7f0000,
    colorPressed: 0x007f00,
    toggle: true
};

VUI.Button.prototype.addEventListener = function(event, func){
    if(this.listeners[event]){
        this.listeners[event].push(func);
    }
};

VUI.Button.prototype.reset = function(){
    this.pressed = false;
    this.color.copy(this.options.colorUnpressed);
    this.cap.position.y = this.rest.y;  
};

VUI.Button.prototype.test = function(cameraPosition, pointerPosition){
    var tag = null;
    this.wasPressed = this.pressed;
    this.reset();
    
    var len = this.direction.copy(this.cap.position)
        .add(this.position)
        .sub(pointerPosition)
        .length();
    if(len <= VUI.BUTTON_TEST_BOXING){
        this.testPoint.copy(pointerPosition)
            .sub(cameraPosition)
            .normalize();
    
        this.direction.copy(this.cap.position)
            .add(this.position)
            .sub(cameraPosition)
            .normalize();
        var dot = this.direction.dot(this.testPoint);
        if(this.options.minDeflection < dot){
            this.testPoint.copy(pointerPosition);
            this.testPoint.y += VUI.BUTTON_TEST_BOXING;
            this.direction.set(0, -1, 0);
            this.raycaster.set(this.testPoint, this.direction);
            this.raycaster.far = VUI.BUTTON_TEST_BOXING * 2;
            var intersections = this.raycaster.intersectObject(this.cap.children[0]);
            if(intersections.length > 0){
                var inter = intersections[0];
                var y = inter.point.y;
                var proportion = Math.max(0, Math.min(this.options.maxThrow, y - pointerPosition.y) / this.options.maxThrow);
                this.touched = proportion > 0;
                this.cap.position.y = this.rest.y - proportion * this.options.maxThrow;
                this.pressed = proportion === 1;
                tag = inter.point;
            }
        }
    }
    
    if(this.pressed){
        if(!this.wasPressed){
            if(this.toggle){
                this.value = !this.value;
            }
            else{
                this.value = true;
            }
            for(var i = 0; i < this.listeners.click.length; ++i){
                this.listeners.click[i].call(this);
            }
        }
    }
    else if(!this.toggle){
        this.value = false;
    }

    this.color.copy(this.value ? this.options.colorPressed : this.options.colorUnpressed);
    
    return tag;
};