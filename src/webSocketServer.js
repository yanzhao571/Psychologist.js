var pairs = {};

function proxyCommand(key, there, command, commandState){
    if(pairs[key][there]){
        pairs[key][there].emit(command, commandState);
    }
}

var types = ["gamepad", "keyboard", "mouse", "motion", "speech"];

module.exports = function (socket) {
    socket.on("key", function (key) {
        var here, there;
        
        if(!pairs[key]){
            pairs[key] = {};
        }

        if(!pairs[key].left){
            here = "left";
            there = "right";
        }
        else if(!pairs[key].right){
            here = "right";
            there = "left";
        }
        else{
            socket.emit("bad");
        }

        if(here && there){
            pairs[key][here] = socket;

            types.forEach(function(t){
                socket.on(t, proxyCommand.bind(socket, key, there, t));
            });

            socket.on("disconnect", function(){
                delete pairs[key][here];
                if(!pairs[key][there]){
                    delete pairs[key];
                }
            });
            socket.emit("good", here);
        }
    });
}