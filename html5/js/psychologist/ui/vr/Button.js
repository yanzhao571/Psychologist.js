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
    
VUI.ButtonFactory = function(mainScene, templateFile, options, done){
    this.mainScene = mainScene;
    this.options = options;
    if(templateFile){
        this.template = new ModelLoader(templateFile, done);
    }
};

VUI.ButtonFactory.prototype.clone = function(options){
    ["maxThrow", "minDeflection", "colorUnpressed", "colorPressed", "toggle"].forEach(function(p){
        if(options[p] === undefined){
            options[p] = this.options[p];
        }
    }.bind(this));
    var factory = new VUI.ButtonFactory(this.mainScene, null, options);
    factory.template = this.template;
    return factory;
};

VUI.ButtonFactory.count = 0;

VUI.ButtonFactory.prototype.create = function(){
    VUI.ButtonFactory.count = (VUI.ButtonFactory.count || 0) + 1;
    var name = "button" + VUI.ButtonFactory.count;
    var btn = new VUI.Button(this.template, name, this.options);
    this.mainScene.buttons.push(btn);
    this.mainScene[btn.name] = btn;
    return btn;
};


VUI.Button = function(template, name, options){
    this.maxThrow = options.maxThrow;
    this.minDeflection = Math.cos(options.minDeflection);
    this.colorUnpressed = new THREE.Color(options.colorUnpressed);
    this.colorPressed = new THREE.Color(options.colorPressed);
    this.toggle = options.toggle;
    this.listeners = { click: [] };
    this.base = template.clone();
    this.position = this.base.position;
    this.rotation = this.base.rotation;
    this.name = name;
    this.cap = this.base.buttons[0];
    this.cap.name = name;
    this.rest = this.cap.position.clone();
    this.color = this.cap.children[0].material.materials[0].color;
    this.value = false;
    this.pressed = false;
    this.wasPressed = false;
    this.direction = new THREE.Vector3();
    this.testPoint = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster(this.testPoint, this.direction, 0, 1);
    delete this.base.buttons;
};

VUI.Button.prototype.addEventListener = function(event, func){
    if(this.listeners[event]){
        this.listeners[event].push(func);
    }
};

VUI.Button.prototype.reset = function(){
    this.pressed = false;
    this.color.copy(this.colorUnpressed);
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
        if(this.minDeflection < dot){
            this.testPoint.copy(pointerPosition);
            this.testPoint.y += VUI.BUTTON_TEST_BOXING;
            this.direction.set(0, -1, 0);
            this.raycaster.set(this.testPoint, this.direction);
            this.raycaster.far = VUI.BUTTON_TEST_BOXING * 2;
            var intersections = this.raycaster.intersectObject(this.cap.children[0]);
            if(intersections.length > 0){
                var inter = intersections[0];
                var y = inter.point.y;
                var proportion = Math.max(0, Math.min(this.maxThrow, y - pointerPosition.y) / this.maxThrow);
                this.touched = proportion > 0;
                this.cap.position.y = this.rest.y - proportion * this.maxThrow;
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

    this.color.copy(this.value ? this.colorPressed : this.colorUnpressed);
    
    return tag;
};