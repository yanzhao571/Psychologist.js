var format = require("util").format,
    fs = require("fs"),
    os = require("os"),
    core = require('./src/core'),
    http = require("http"),
    webServer = require("./src/webServer"),
    proc = require("child_process").spawn,
    options = require("./src/options"),
    minify = require("./src/minifier"),
    path = require("path"),
    srcDir = "html5",
    startPage = "tracker.html",
    startProc, app, port, template;

options.parse(process.argv);

startProc = {
    linux: "xdg-open",
    win32: "explorer"
}[os.platform()];

if(options.m == "true"){
    minify(
        options.i || "html5",
        options.o || "obj",
        options.v != "false",
        options.s != "false");
    srcDir = "obj";
}

app = http.createServer(webServer(srcDir));
port = 8080;
app.listen(port);
if(options.m != "true" && startProc){
    template = "http://localhost/$2";
    if(port != 80){
        template = "http://localhost:$1/$2";
    }
    proc(startProc, [core.fmt(template, port, startPage)]);
}