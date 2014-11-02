/* 
 * Copyright (C) 2014 Sean McBeth
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var fmt = require("../core").fmt,
    master = require("../master"),
    fs = require("fs");

module.exports = {
    path: "holodeck.html",
    pattern: /^\/holodeck.html$/,
    GET: function(params, sendData, sendStaticFile, serverError){
        fs.readFile("src/templates/holodeck.about.html", 
            {encoding: "utf8"}, 
            function(err, about){
                if(err){
                    serverError(500, err);
                }
                else{
                    master.build(sendData, serverError, 
                        "src/templates/game.html", 
                        "holodeck",
                        "Psychologist.js: a WebGL VR Framework", 
                        about.replace(/\\/g, "\\\\")
                            .replace(/\r/g, "")
                            .replace(/\n/g, "\\r\\n")
                            .replace(/"/g, "\\\""));
                }
            }
        );
    }
};