var fmt = require("./src/core").fmt,
    fs = require("fs");
    
fs.writeFileSync("/dev/usb/lp0", "test output", "ascii");