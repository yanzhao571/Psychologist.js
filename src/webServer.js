var fs = require("fs"),
    mime = require("mime"),
    url = require("url"),
    core = require("./core.js"),
    routes = require("./controllers.js"),
    filePattern = /([^?]+)(\?([^?]+))?/;

function serverError(res, code) {
    var rest = Array.prototype.slice.call(arguments, 2),
        msg = rest.length == 0 ? "" : core.fmt(" -> [$1]", rest.join("], ["));
    res.writeHead(code);
    if(code >= 500){
        console.error("Error", rest);
        res.end("Error" + msg);
    }
    else{
        console.warn("Warning", rest);
        res.end("Warning" + msg);
    }
}

function matchController(res, url, method) {
    var found = false;
    for (var i = 0; i < routes.length && !found; ++i) {
        var matches = url.match(routes[i].pattern);
        if (matches) {
            found = true;
            matches.shift();
            routes[i].handler.call(this, method, matches, function (mimeType, data) {
                res.writeHead(200, { "Content-Type": mimeType, "Content-Length": data.length });
                res.end(data);
            }, serverError.bind(this, res, 500, core.fmt("Server error [$1]", url)));
        }
    }
    return found;
}

function sendStaticFile(res, url, path) {
    fs.readFile(path, function (err, data) {
        if (err) {
            serverError(res, 403, core.fmt("Permission denied [$1]", url));
        }
        else {
            res.writeHead(200, { "Content-Type": mime.lookup(path), "Content-Length": data.length });
            res.end(data);
        }
    });
}

/*
    Creates a callback function that listens for requests and either redirects them
    to the port specified by `target` (if `target` is a number) or serves applications
    and static files from the directory named by `target` (if `target` is a string).
    
    target: a number or a string.
        - number: the port number to redirect to, keeping the request the same, otherwise.
        - string: the directory from which to serve static files.
*/
module.exports = function (target) {
    if(typeof(target) === "number" || target instanceof Number){
        return function (req, res) {
            var url = "https://" + req.headers.host.replace(/(:\d+|$)/, ":" + target) + req.url;
            console.log("redirecting to", url);
            res.writeHead(307, { "Location": url });
            res.end();
        }
    }
    else if(typeof(target) === "string" || target instanceof String){
        return function(req, res){
            if (!matchController(res, req.url, req.method) && req.method == "GET") {
                var path = target + req.url,
                file = path.match(filePattern)[1];
                fs.exists(file, function (yes) {
                    if (yes) {
                        sendStaticFile(res, req.url, file);
                    }
                    else {
                        serverError(res, 404, core.fmt("File not found [$1]", path));
                    }
                });
            }
        }
    }
    else{
        throw new Error("`target` parameter not a supported type. Excpected number or string. Given: " + target + ", type: " + typeof(target));
    }
};