function ModelOutput(){
}

ModelOutput.prototype.loadCollada = function(src, progress, success){
    var loader = new THREE.ColladaLoader();
    loader.options.convertUpAxis = true;
    progress("loading", src);
    loader.load("scene/untitled.dae", function(collada){
        success(collada);
        progress("success", src);
    }, function(prog){
        progress("intermediate","scene/untitled.dae", prog.loaded)
    });
}