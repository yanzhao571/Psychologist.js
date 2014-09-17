var fmt = require("./core").fmt,
    fs = require("fs");

module.exports = {
    build: function(done, error, templateFile){
        var rest = Array.prototype.slice.call(arguments, 3);
        this.dump(templateFile, done, error, function(file){
            return fmt.bind(global, file).apply(global, rest);
        });
    },
    dump: function(src, done, error, format){
        fs.readFile(src, {encoding: "utf8"}, function (err, file){
            if (err){
                error(fmt("Couldn't find template file [$1]", src), err);
            }
            else{
                done("text/html", format ? format(file) : file);
            }
        });
    }
};