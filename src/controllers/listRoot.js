var fmt = require("../core").fmt,
    master = require("../master"),
    controllers = require("../controllers"),
    fs = require("fs");

module.exports = {
    path: "",
    pattern: /^\/$/,
    handler: function(method, params, done, error){
        if(method != "GET"){
            error("This controller only supports GET requests");
        }
        else{
            fs.readdir("html5", function(err, files){
                if(err){
                    error("Couldn't read root directory", err);
                }
                else{
                    var paths = files.filter(function(f){
                        return /\.html$/.test(f);
                    })
                    .concat(controllers.filter(function(c){
                            return c.path && c.path.length > 0;
                        })
                        .map(function(c){
                            return c.path;
                        })
                    )
                    .map(function(file){
                        return fmt("<li><a href=\"$1\">$1</a></li>", file);
                    })
                    .join("");

                    master.build(done, error, "src/templates/master.html", "Root file list", 
                        fmt("<div id=\"instructions\"><h1>JSVR</h1><p>Virtual reality-related HTML5 and JavaScript demos</p><ul>$1</ul></div>", paths));
                }
            });
        }
    }
}