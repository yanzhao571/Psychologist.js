var format = require("util").format,
    fs = require("fs"),
    http = require("http"),
    https = require("https"),
    path = require("path"),
    socketio = require("socket.io"),
    starter = require("./src/starter"),
    webServer = require("./src/webServer"),
    webSocketServer = require("./src/webSocketServer"),
    options = require("./src/options"),

    srcDir = "html5",
    startPage = "demo.html",
    port = 8080,
    app, io;

options.parse(process.argv);

function start(key, cert){
    if(key && cert){
        console.log("secure");
        app = https.createServer({key: key, cert: cert}, webServer(srcDir));
    }
    else{
        console.log("insecure");
        app = http.createServer(webServer(srcDir));
    }
    app.listen(port);
    io = socketio.listen(app);
    io.sockets.on("connection", webSocketServer);
    try{
        starter(!!(key && cert), port, startPage);
    }
    catch(exp){
        console.error("couldn't start browser", exp.message);
    }
}

fs.readFile("../key.pem", {encoding: "utf8"}, function(err, key){
    if(err){
        console.log("no key", err);
        start();
    }
    else{
        console.log("key found");
        fs.readFile("../cert.pem", {encoding: "utf8"}, function(err, cert){ 
            if(err){   
                console.log("no cert", err);
                start();
            }
            else{
                console.log("cert found");
                start(key, cert);
            }
        });
    }
});