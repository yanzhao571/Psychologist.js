function LocationInput(name, commands, socket, options, oscope){
    this.options = options || {};
    for(var key in LocationInput.DEFAULTS){
        this.options[key] = this.options[key] || LocationInput.DEFAULTS[key];
    }
    this.isStreaming = false;
    ButtonAndAxisInput.call(this, name, commands, socket, oscope, 1, LocationInput.AXES);
    this.available = !!navigator.geolocation;
    if(this.available){
        navigator.geolocation.watchPosition(
            this.setState.bind(this),
            function(){ this.available = false; }.bind(this), 
            this.options);
    }
}
LocationInput.AXES = ["LONGITUDE", "LATITUDE", "ALTITUDE", "HEADING", "SPEED"];
ButtonAndAxisInput.inherit(LocationInput);

LocationInput.DEFAULTS = {
    enableHighAccuracy: true,
    maximumAge: 30000,
    timeout: 25000
};

LocationInput.prototype.setState = function(location){    
    for(var p in location.coords){
        var k = p.toUpperCase();
        if(LocationInput.AXES.indexOf(k) > -1){
            this.setAxis(k, location.coords[p]);
        }
    }
};