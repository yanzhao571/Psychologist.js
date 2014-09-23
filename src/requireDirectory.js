var fs = require("fs");

module.exports = function requireDirectory(path, mod, done){
    mod.exports = [];
    fs.readdir("./src/" + path, function(err, files){
        console.log(path, files);
        if(!err){
            for(var i = 0; i < files.length; ++i) {
                mod.exports.push(require("./" + path + "/" + files[i]));
            }
        }
        if(done){
            done();
        }
    });
}