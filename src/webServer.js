var fs = require("fs"),
    mime = require("mime"),
    core = require("./core.js"),
    routes = require("./controllers.js"),
    filePattern = /([^?]+)(\?([^?]+))?/;

function serverError(res, code) {
    var rest = Array.prototype.slice.call(arguments, 2),
        msg = rest.length == 0 ? "" : core.fmt(" -> [$1]", rest.join("], ["));
    res.writeHead(500);
    console.log("Error", rest);
    res.end("Error" + msg);
}

function matchController(res, url, method) {
    var found = false;
    for (var i = 0; i < routes.length && !found; ++i) {
        var matches = url.match(routes[i].pattern);
        if (matches) {
            found = true;
            matches.shift();
            routes[i].handler.call(this, method, matches, function (mimeType, data) {
                res.writeHead(200, { "Content-Type": mimeType });
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
            res.writeHead(200, { "Content-Type": mime.lookup(path) });
            res.end(data);
        }
    });
}

module.exports = function (dirName) {
    return function (req, res) {
        if (!matchController(res, req.url, req.method) && req.method == "GET") {
            var path = dirName + req.url,
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
};