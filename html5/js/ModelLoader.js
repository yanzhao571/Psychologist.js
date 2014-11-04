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

var COLLADA = new THREE.ColladaLoader();
COLLADA.options.convertUpAxis = true;
function ModelLoader(src, success){
    this.buttons = [];
    if(src){
        ModelLoader.loadCollada(src, function(object){
            this.template = object;
            if(success){
                success(object);
            }
        }.bind(this));
    }
}

ModelLoader.setProperties = function(object, src){
    object.buttons = [];
    object.traverse(function(child){
        if(child.name){
            object[child.name] = child;
        }
        if(child.material){
            child.material = child.material.clone();
        }
        for(var i = 0; i < child.children.length; ++i){
            var obj = child.children[0];
            if(obj instanceof THREE.Mesh){
                var materials = obj.material.materials;
                if(materials){
                    for(var i = 0; i < materials.length; ++i){
                        console.log(src, object.name || "_", child.name || "_", obj.name || "_", materials[i].name || "_");
                        child.isSolid = child.isSolid || materials[i].name === "solid";
                        child.isButton = child.isButton || materials[i].name === "button";
                    }
                    // This is straight-up garbage, but I'll eventually fix it.
                    // Nope, I really mean it.
                    if(child.isButton){
                        if(object.children.length === 1){
                            console.log("OK");
                            object.buttons.push(child);
                        }
                        else{
                            console.log("MEH");
                            child.buttons = [child];
                            object.buttons.push(new VUI.Button(child, child.name));
                        }
                    }
                }
            }
        }
    });
};

ModelLoader.loadCollada = function(src, success){
    COLLADA.load(src, function(collada){
        ModelLoader.setProperties(collada.scene, src);
        if(success){
            success(collada.scene);
        }
    });
};

ModelLoader.prototype.clone = function(){
    var obj = this.template.clone();
                
    obj.traverse(function(child){
        if (child instanceof THREE.SkinnedMesh ){
			obj.animation = new THREE.Animation(child, child.geometry.animation);
            if(!this.template.originalAnimationData && obj.animation.data){
                this.template.originalAnimationData = obj.animation.data;
            }
            if(!obj.animation.data){
                obj.animation.data = this.template.originalAnimationData;
            }
		}
    }.bind(this));
    
    ModelLoader.setProperties(obj);
    return obj;
};