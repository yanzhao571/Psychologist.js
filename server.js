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
    startPage = "motion.html";

options.parse(process.argv);

var srcDir = "html5";
var startProc = (os.platform() == "win32") ? "explorer" : null;

if(options.m == "true"){
    minify(
        options.i || "html5",
        options.o || "obj",
        options.v != "false",
        options.s != "false");
    srcDir = "obj";
}

var app = http.createServer(webServer(srcDir));
var port = 8080;;
app.listen(port);
if(options.m != "true" && startProc){
    var template = "http://localhost/$2"
    if(port != 80){
        template = "http://localhost:$1/$2";
    }
    proc(startProc, [core.fmt(template, port, startPage)]);
}