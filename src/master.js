var fmt = require("./core").fmt,
    fs = require("fs");

module.exports = {
    build: function(done, error, templateFile){
        var rest = Array.prototype.slice.call(arguments, 3);
        fs.readFile(templateFile, {encoding: "utf8"}, function (err, template){
            if (err){
                error(fmt("Couldn't find template file [$1]", templateFile), err);
            }
            else{
                done("text/html", fmt.bind(global, template).apply(global, rest));
            }
        });
    }
};