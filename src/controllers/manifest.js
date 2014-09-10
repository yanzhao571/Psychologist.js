var fmt = require("../core").fmt,
    fs = require("fs");

function makeManifest(strings, done, index, accum){
    index = index || 0;
    accum = accum || [];
    if(index >= strings.length){
        done(200, JSON.stringify(accum));
    }
    else{
        fs.stat("html5/" + strings[index], function(err, stats){
            if(!err){
                accum.push({name: strings[index], size: stats["size"]});
            }
            setImmediate(makeManifest, strings, done, index + 1, accum);
        });
    }
}

module.exports = {
    pattern: /^\/manifest\/(\w+(?:\/\w+)*\.js)$/,
    handler: function(method, params, done, error){
        if(method != "GET"){
            error("This controller only supports GET requests");
        }
        else{
            var file = params[0];
            fs.readFile("html5/" + file, {encoding: "utf8"}, function(err, file){
                if(err){
                    error("not found");
                }
                else{
                    file = file.replace(/\\"/g, "{ESCAPED_QUOTE}")
                    var strings = file.match(/"[^"]*"/g)
                        .map(function(a){
                            return a.substring(1, a.length - 1);
                        }).sort();

                    strings = strings.filter(function(a, i){
                        return a.length > 0 && (i == 0 || a != strings[i-1]);
                    });
                    makeManifest(strings, done);
                }
            });
        }
    }
}