var fs = require("fs"),
    mime = require("mime"),
    core = require("./core.js"),
    routes = require("./controllers.js"),
    filePattern = /([^?]+)(\?([^?]+))?/;;

function sendStaticFile(res, url, path){
    fs.readFile(path, function (err, data){
        if (err){
            serverError(res, url);
        }
        else{
            res.writeHead(200, { "Content-Type": mime.lookup(path) });
            res.end(data);
        }
    });
}

module.exports = function(dirName){
    return function(req, res){
        if (req.method === "GET" && req.url[0] === "/"){
            if (req.url.length == 1){
                req.url += "index.html";
            }

            var path = dirName + req.url,
                parts = path.match(filePattern),
                file = parts[1],
                queryString = parts[3];

            fs.exists(file, function(yes){
                if(yes){
                    sendStaticFile(res, req.url, file);
                }
                else{
                    matchController(res, path)
                }
            });
        }
        else{
            serverError(res);
        }
    }
};

function serverError(res, path){
    if (path){
        res.writeHead(404);
        res.end("error loading " + path.substring(1));
    }
    else{
        res.writeHead(500);
        res.end("error");
    }
}

function matchController(res, path){
    var found = false;
    for(var i = 0; i < routes.length; ++i){
        var matches = path.match(routes[i].pattern);
        if(matches){
            found = true;
            matches.shift();
            routes[i].handler.call(this, matches, function(mimeType, data){
                res.writeHead(200, {"Content-Type": mimeType});
                res.end(data);
            }, serverError.bind(this, res, path));
        }
    }
    if(!found){
        serverError(res, path);
    }
}