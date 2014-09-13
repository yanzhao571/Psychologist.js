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

ModelOutput.prototype.clone = function(){
    var obj = this.template.clone();
                
    obj.traverse(function(child){
        if (child instanceof THREE.SkinnedMesh ) {
            obj.mesh = child;
			child.animation = new THREE.Animation(child, child.geometry.animation);
            if(!this.template.originalAnimationData && child.animation.data){
                this.template.originalAnimationData = child.animation.data;
            }
            if(!child.animation.data){
                child.animation.data = this.template.originalAnimationData;
            }
		}
    }.bind(this));
    return obj;
};