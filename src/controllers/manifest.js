var fmt = require("../core").fmt,
    fs = require("fs");

function makeManifest(strings, sendData, index, accum){
    index = index || 0;
    accum = accum || [];
    if(index >= strings.length){
        var data = JSON.stringify(accum);
        sendData("application/json", data, data.length);
    }
    else{
        fs.stat("html5/" + strings[index], function(err, stats){
            if(!err){
                accum.push({name: strings[index], size: stats.size});
            }
            setImmediate(makeManifest, strings, sendData, index + 1, accum);
        });
    }
}

module.exports = {
    pattern: /^\/manifest\/([\w.]+(?:\/[\w.]+)*\.js)(?:\?)?/,
    GET: function(params, sendData, sendStaticFile, serverError){
        var path = "html5/" + params[0];
        fs.exists(path, function(yes){
            if(!yes){
                serverError(404);
            }
            else{
                fs.readFile(path, {encoding: "utf8"}, function(err, file){
                    if(err){
                        serverError(500, err);
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
                        makeManifest(strings, sendData);
                    }
                });
            }
        });
    }
}