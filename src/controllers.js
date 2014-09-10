var fs = require("fs");

module.exports = [];
fs.readdir("./src/controllers", function(err, files){
    if(!err){
        for(var i = 0; i < files.length; ++i) {
            module.exports.push(require("./controllers/" + files[i]));
        }
    }
});