var pairs = {};

function proxyCommand(key, there, command, commandState){
    if(pairs[key][there]){
        pairs[key][there].emit(command, commandState);
    }
}

var types = ["gamepad", "keyboard", "mouse", "touch", "motion", "speech"];

module.exports = function (socket) {
    socket.on("key", function (key) {
        var here, there, pair;
        
        if(!pairs[key]){
            pairs[key] = {};
        }

        pair = pairs[key];

        if(!pair.left){
            here = "left";
            there = "right";
        }
        else if(!pair.right){
            here = "right";
            there = "left";
        }
        else{
            socket.emit("bad");
        }

        if(here && there){
            pair[here] = socket;

            types.forEach(function(t){
                socket.on(t, proxyCommand.bind(socket, key, there, t));
            });

            socket.on("disconnect", function(){
                delete pair[here];
                if(pair[there]){
                    pair[there].emit("close");
                }
                else{
                    delete pairs[key];
                    pair = null;
                }
            });
            socket.emit("good", here);
            if(pair[there]){
                pair[there].emit("open");
            }
        }
    });
}