
function Surface(id, w, h){
    this.width = w || CANV_WIDTH;
    this.height = h || CANV_HEIGHT;

    this.canv = getDOM("#" + id);
    if(!this.canv){
        this.canv = document.createElement("canvas");
        this.canv.id = id;
    }
    this.canv.width = this.width;
    this.canv.height = this.height;

    this.gfx = this.canv.getContext("2d");
    this.gfx.font = "20px Arial";
}

Surface.prototype.drawImage = function(i, x, y, w, h){
    i = i.canv || i;
    w = w || i.width || i.videoWidth;
    h = h || i.height || i.videoHeight;
    this.gfx.drawImage(i, x, y, w, h);
};

Surface.prototype.clear = function(){
    this.gfx.fillStyle = "#000000";
    this.gfx.fillRect(0, 0, this.width, this.height);
}

Surface.prototype.drawTextBox = function(text, y, lineHeight, color){
    this.gfx.fillStyle = color;
    text = text.split("\n");
    var gfx = this.gfx;
    var maxWidth = Math.max.apply(Math, text.map(function(line){
        return gfx.measureText(line).width;
    }));
    var cx = 0.5 * (this.width - maxWidth);
    text.forEach(function(line, i){
        gfx.fillText(line, cx, y + lineHeight * i);
    });
}