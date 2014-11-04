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
    if(src){
        ModelLoader.loadCollada(src, function(scene){
            this.template = scene;
            if(success){
                success(scene);
            }
        }.bind(this));
    }
}

ModelLoader.setProperties = function(object){
    object.traverse(function(child){
        for(var i = 0; i < child.children.length; ++i){
            var obj = child.children[i];
            if(obj instanceof THREE.Mesh){
                var materials = obj.material.materials;
                if(materials){
                    for(var j = 0; j < materials.length; ++j){
                        child.isSolid = child.isSolid || materials[j].name === "solid";
                        child.isButton = child.isButton || materials[j].name === "button";
                    }
                }
            }
        }
    });
};

ModelLoader.loadCollada = function(src, success){
    COLLADA.load(src, function(collada){
        ModelLoader.setProperties(collada.scene);
        if(success){
            success(collada.scene);
        }
    });
};

ModelLoader.loadScene = function(src, success){
    ModelLoader.loadCollada(src, function(scene){
        scene.buttons = [];
        scene.traverse(function(child){
            if(child.isButton){
                scene.buttons.push(new VUI.Button(child.parent, child.name));
            }
            if(child.name){
                scene[child.name] = child;
            }
        });
        if(success){
            success(scene);
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