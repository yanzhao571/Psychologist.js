function ModelOutput(src, progress, success){
    if(src){
        ModelOutput.loadCollada(src, progress, function(object){
            this.template = object;
            object.traverse(function(child){
                if(child.name){
                    this[child.name] = child;
                }
            }.bind(this));
            success(object);
        }.bind(this));
    }
}

ModelOutput.loadCollada = function(src, progress, success){
    progress("loading", src);
    var loader = new THREE.ColladaLoader();
    loader.options.convertUpAxis = true;
    loader.load(src, function(collada){
        success(collada.scene);
        progress("success", src);
    }, function(prog){
        progress("intermediate", src, prog.loaded)
    });
};

ModelOutput.makeHeightMap = function(obj, CLUSTER){
    var heightmap = [];
    var verts = obj.children[0].geometry.vertices;
    heightmap.minX = 0;
    heightmap.minZ = 0;
    for(var i = 0; i < verts.length; ++i){
        heightmap.minX = Math.min(heightmap.minX, verts[i].x);
        heightmap.minZ = Math.min(heightmap.minZ, verts[i].z);
    }
    for(var i = 0; i < verts.length; ++i){
        var x = Math.round((verts[i].x - heightmap.minX) / CLUSTER);
        var z = Math.round((verts[i].z - heightmap.minZ) / CLUSTER);
        if(!heightmap[z]){
            heightmap[z] = [];
        }
        if(heightmap[z][x] == undefined){
            heightmap[z][x] = verts[i].y;
        }
        else{
            heightmap[z][x] = Math.max(heightmap[z][x], verts[i].y);
        }
    }
    return heightmap;
};

ModelOutput.prototype.clone = function(userName, socket){
    var obj = this.template.clone();
                
    obj.traverse(function(child){
        if (child instanceof THREE.SkinnedMesh ) {
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

    if(socket){
        socket.on("userState", function(user, state){
            if(user == userName){
                obj.setRotationFromEuler(new THREE.Euler(0, 0, 0, "XYZ"));
                obj.rotateY(state.heading);
                obj.position.x = state.x;
                obj.position.y = state.y;
                obj.position.z = state.z;
                if(state.isRunning && !obj.animation.isPlaying){
                    obj.animation.play();
                }
                else if(!state.isRunning && obj.animation.isPlaying){
                    obj.animation.stop();
                }
            }
        });
    }

    return obj;
};