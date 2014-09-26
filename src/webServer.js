var fs = require("fs"),
    http = require("http"),
    mime = require("mime"),
    url = require("url"),
    stream = require("stream"),
    core = require("./core.js"),
    routes = require("./controllers.js"),
    filePattern = /([^?]+)(\?([^?]+))?/;

function serverError(res, url, code) {
    var rest = Array.prototype.slice.call(arguments, 3),
        msg = core.fmt("URL: [$1] $2: $3", url, code, http.STATUS_CODES[code]);
    if (rest.length > 0) {
        msg += core.fmt(" -> [$1]", rest.join("], ["));
    }

    if (code >= 500) {
        console.error("Error", msg);
    }
    else{
        console.warn("Warning", msg);
    }

    res.writeHead(code);
    res.end(msg);
}

function matchController(res, url, method) {
    var found = false;
    for (var i = 0; i < routes.length && !found; ++i) {
        var matches = url.match(routes[i].pattern);
        if (matches) {
            found = true;
            matches.shift();
            var handler = routes[i][method];
            if(!handler){
                serverError(res, url, 405);
            }
            else{
                handler(
                    matches,
                    sendData.bind(this, res),
                    sendStaticFile.bind(this, res, url),
                    serverError.bind(this, res, url)
                );
            }
        }
    }
    return found;
}

function sendStaticFile(res, url, path) {    
    fs.exists(path, function (yes) {
        if (yes) {
            try{                
                fs.stat(path, function(err, stats){
                    if(err){
                        serverError(res, url, 500, err);
                    }
                    else{
                        sendData(res, mime.lookup(path), fs.createReadStream(path), stats.size);
                    }
                });
            }
            catch(exp){
                serverError(res, url, 403, exp);
            }
        }
        else {
            serverError(res, url, 404, path);
        }
    });
}

function sendData(res, mimeType, data, length) {
    if (!mimeType) {
        res.writeHead(415);
        res.end();
    }
    else {
        res.writeHead(200, {
            "Content-Type": mimeType,
            "Content-Length": length,
            "Connection": "keep-alive"
        });
        if(data instanceof stream.Readable){
            data.pipe(res);
        }
        else{
            res.end(data);
        }
    }
}

function serveRequest(target, req, res) {
    if (!matchController(res, req.url, req.method) && req.method == "GET") {
        if (req.url.indexOf("..") == -1) {
            var path = target + req.url,
                file = path.match(filePattern)[1];
            sendStaticFile(res, req.url, file);
        }
        else {
            serverError(res, req.url, 403);
        }
    }
}

function redirectPort(host, target, req, res) {
    var reqHost = req.headers.host && req.headers.host.replace(/(:\d+|$)/, ":" + target);
    var url = "https://" + reqHost + req.url;
    if (reqHost
        && (host == "localhost" || reqHost == host + ":" + target)
        && !/https?:/.test(req.url)) {
        res.writeHead(307, { "Location": url });
    }
    else {
        serverError(res, url, 400);
    }
    res.end();
}

function isString(v) { return typeof (v) === "string" || v instanceof String; }
function isNumber(v) { return isFinite(v) && !isNaN(v); }

/*
    Creates a callback function that listens for requests and either redirects them
    to the port specified by `target` (if `target` is a number) or serves applications
    and static files from the directory named by `target` (if `target` is a string).
    
    `host`: the name of the host to validate against the HTTP header on request.
    `target`: a number or a string.
        - number: the port number to redirect to, keeping the request the same, otherwise.
        - string: the directory from which to serve static files.
*/
module.exports = function (host, target) {
    if (!isString(host)) {
        throw new Error("`host` parameter not a supported type. Excpected string. Given: " + host + ", type: " + typeof (host));
    }
    else if (!isString(target) && !isNumber(target)) {
        throw new Error("`target` parameter not a supported type. Excpected number or string. Given: " + target + ", type: " + typeof (target));
    }
    else if (isString(target)) {
        return serveRequest.bind(this, target);
    }
    else {
        return redirectPort.bind(this, host, target);
    }
};