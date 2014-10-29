var fmt = require("../core").fmt,
    fs = require("fs"),
    fr = require("../fileReferences"),
    findControllers = require("../webServer").findController;
    
module.exports = {
    pattern: /^\/([\w.]+(?:\/[\w.]+)*\.appcache)(?:\?)?/,
    GET: function(params, sendData, sendStaticFile, serverError){
        var skipURL = params[0];
            fileURL = skipURL.replace("appcache", "html");
        fr.getFileDescription(fileURL, null, function(desc){
            fr.findFilesInFiles([fileURL], skipURL, sendAppCache.bind(this,  desc.stamp, sendData), serverError);
        });
    }
};

function sendAppCache(mainFileTime, sendData, files){
    fr.getFileDescriptions(files, function(descriptions){
        var data = fmt("CACHE MANIFEST\n# $1\nCACHE:", mainFileTime);
        for(var i = 0; i < descriptions.length; ++i){
            // Appending these timestamps to the manifest will change the byte
            // signature of the manifest when the timestamps update, i.e. newer
            // versions of the files are uploaded. This then indicates to the
            // browser that a new app update needs to be downloaded.
            //
            // We could hash the contents of the files instead, in case the file
            // was touched but not updated, but that isn't likely to occur on
            // the server and this is quicker and easier.
            data += fmt("\n# $1\n$2", descriptions[i].stamp, descriptions[i].name);
        }
        data += "\nNETWORK:\n*";
        sendData("text/cache-manifest", data, data.length); 
    });
}