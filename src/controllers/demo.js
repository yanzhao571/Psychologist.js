var master = require("../master");

module.exports = {
    path: "demo",
    pattern: /^\/demo(?:\.html)?$/,
    handler: function(method, params, done, error){
        if(method != "GET"){
            error("This controller only supports GET requests");
        }
        else{
            master.dump("src/templates/demo.html", done, error);
        }
    }
}