var COLLADA = new THREE.ColladaLoader();
COLLADA.options.convertUpAxis = true;
function ModelLoader(src, progress, success){
    this.buttons = [];
    if(src){
        ModelLoader.loadCollada(src, progress, function(object){
            this.template = object;
            if(success){
                success(object);
            }
        }.bind(this));
    }
}

ModelLoader.setProperties = function(object){
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
                        child.isSolid = child.isSolid || materials[i].name === "solid";
                        child.isButton = child.isButton || materials[i].name === "button";
                    }
                    if(child.isButton){
                        object.buttons.push(child);
                    }
                }
            }
        }
    });
};

ModelLoader.loadCollada = function(src, progress, success){
    progress("loading", src);
    COLLADA.load(src, function(collada){
        ModelLoader.setProperties(collada.scene);
        if(success){
            success(collada.scene);
        }
        progress("success", src);
    }, function(prog){
        progress("intermediate", src, prog.loaded);
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