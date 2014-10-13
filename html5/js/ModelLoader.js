var COLLADA = new THREE.ColladaLoader();
COLLADA.options.convertUpAxis = true;
function ModelLoader(src, progress, success){
    if(src){
        ModelLoader.loadCollada(src, progress, function(objects){
            this.template = objects;
            objects.traverse(function(child){
                if(child.name){
                    this[child.name] = child;
                    var mesh = child.children[0];
                    if(mesh instanceof THREE.Mesh){
                        var materials = mesh.material.materials;
                        if(materials){
                            for(var i = 0; i < materials.length; ++i){
                                child.isSolid = materials[i].name === "solid";
                                child.isButton = materials[i].name === "button";
                                if(child.isButton){
                                    materials[0] = materials[0].clone();
                                }
                            }
                        }
                        mesh.geometry.computeBoundingBox();
                        var delta = new THREE.Vector3().subVectors(
                            mesh.geometry.boundingBox.max, 
                            mesh.geometry.boundingBox.min
                        ).multiplyScalar(0.5);
                        var shape = new CANNON.Box(new CANNON.Vec3(
                            delta.x, 
                            delta.y, 
                            delta.z
                        ));
                        var body = new CANNON.Body({
                            mass: 1
                        });
                        body.position.copy(child.position);
                        body.addShape(shape);
                        body.angularVelocity.set(0, 0, 0);
                        body.angularDamping = 0.5;
                        body.returnState = function(){
                            child.position.copy(body.position);
                            child.quaternion.copy(body.quaternion);
                        };
                        child.physicsBody = body;
                        
                    }
                }
            }.bind(this));
            if(success){
                success(objects);
            }
        }.bind(this));
    }
}

ModelLoader.loadCollada = function(src, progress, success){
    progress("loading", src);
    COLLADA.load(src, function(collada){
        if(success){
            success(collada.scene);
        }
        progress("success", src);
    }, function(prog){
        progress("intermediate", src, prog.loaded);
    });
};

ModelLoader.prototype.clone = function(userName, socket){
    var obj = this.template.clone();
    this.socket = socket;
                
    obj.traverse(function(child){
        if (child instanceof THREE.SkinnedMesh ){
            obj.mesh = child;
			obj.animation = new THREE.Animation(child, child.geometry.animation);
            if(!this.template.originalAnimationData && obj.animation.data){
                this.template.originalAnimationData = obj.animation.data;
            }
            if(!obj.animation.data){
                obj.animation.data = this.template.originalAnimationData;
            }
		}
    }.bind(this));

    return obj;
};