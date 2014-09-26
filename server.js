var format = require("util").format,
    fs = require("fs"),
    http = require("http"),
    https = require("https"),
    path = require("path"),
    socketio = require("socket.io"),
    zlib = require("zlib"),
    log = require("./src/core").log,
    starter = require("./src/starter"),
    webServer = require("./src/webServer"),
    webSocketServer = require("./src/webSocketServer"),
    options = require("./src/options").parse(process.argv, {
        v: true
    }),

    srcDir = "html5",
    startPage = "",
    port = 8080,
    host = options.h || "localhost",
    app, redir, io;

var files = fs.readdirSync(srcDir).map(function(f){ return srcDir + "/" + f; });
var toZip = [];
while(files.length > 0){
    var file = files.shift();
    var stat = fs.statSync(file);
    if(stat.isDirectory()){
        var nextfiles = fs.readdirSync(file);
        for(var i = 0; i < nextfiles.length; ++i){
            files.push(file + "/" + nextfiles[i]);
        }
    }
    else if(stat.isFile()){
        if(/\.gz$/.test(file)){
            fs.unlinkSync(file);
        }
        else{
            toZip.push(file);
        }
    }
}

toZip.forEach(function(file){
    console.log("zipping file", file);
    zlib.gzip(fs.readFileSync(file), function(err, zip){
        fs.writeFileSync(file + ".gz", zip)
    });
});

function start(key, cert, ca){
    var useSecure = !!(key && cert && ca);
    if(useSecure){
        log("secure");
        app = https.createServer({key: key, cert: cert, ca: ca}, webServer(host, srcDir));
        redir = http.createServer(webServer(host, port + 1));
        redir.listen(port);
        app.listen(port + 1);
    }
    else{
        log("insecure");
        app = http.createServer(webServer(host, srcDir));
        app.listen(port);
    }
    io = socketio.listen(app);
    io.sockets.on("connection", webSocketServer);
    
    if(options.v !== "false"){
        try{
            starter(useSecure, port + (useSecure ? 1 : 0), startPage);
        }
        catch(exp){
            console.error("couldn't start browser", exp.message);
        }
    }
}

function readFiles(files, error, success, index, accum){
    index = index || 0;
    accum = accum || [];
    if(index == files.length){
        success(accum);
    }
    else{
        fs.exists(files[index], function(yes){
            if(yes){
                fs.readFile(files[index], {encoding: "utf8"}, function(err, file){
                    if(err){
                        error(err);
                    }
                    else{
                        accum.push(file);
                        setImmediate(readFiles, files, error, success, index + 1, accum);
                    }
                });
            }
            else{
                error(files[index] + " does not exist");
            }
        });
    }
}

readFiles([
    "../key.pem",
    "../cert.pem",
    "../ca.pem"],
    function(err){
        console.error(err);
        start();
    },
    function(files){
        start.apply(this, files);
    }
);
