var fmt = require("../core").fmt,
    fs = require("fs"),
    fr = require("../fileReferences");
    
module.exports = {
    pattern: /^\/manifest\/([\w.]+(?:\/[\w.]+)*\.js)(?:\?)?/,
    GET: function(params, sendData, sendStaticFile, serverError){
        var fileURL = params[0],
            skipURL = "manifest/" + fileURL;
        fs.exists("html5/" + fileURL, function(yes){
            if(!yes){
                serverError(404);
            }
            else{
                fr.findFilesInFile(fileURL, skipURL, sendJSON.bind(this, sendData), serverError);
            }
        });
    }
};

function sendJSON(sendData, files){
    fr.getFileDescriptions(files, function(descriptions){
        for(var i = 0; i < descriptions.length; ++i){
            delete descriptions[i].stamp;
        }
        var data = JSON.stringify(descriptions);
        sendData("application/json", data, data.length); 
    });
}