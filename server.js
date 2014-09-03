var format = require("util").format,
    fs = require("fs"),
    os = require("os"),
    http = require("http"),
    path = require("path"),
    socketio = require("socket.io"),
    spawn = require("child_process").spawn,

    webServer = require("./src/webServer"),
    webSocketServer = require("./src/webSocketServer"),
    options = require("./src/options"),

    srcDir = "html5",
    port = 8080,
    startPage = "",
    startProc = {
        linux: "xdg-open",
        win32: "explorer"
    }[os.platform()],
    
    app, startUrl, io;

options.parse(process.argv);

app = http.createServer(webServer(srcDir));
app.listen(port);
io = socketio.listen(app);
io.sockets.on("connection", webSocketServer);

if(options.v != "false" && startProc){
    startUrl = "http://localhost";
    if(port != 80){
        startUrl += ":" + port;
    }
    spawn(startProc, [startUrl + "/" + startPage]);
}