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

var audio = new Audio3DOutput();
var ROWS = 4;
var COLS = 4;
var FRAMES_PER_SECOND = 16;
var DT = 1000 / FRAMES_PER_SECOND;
var TILES = ROWS * COLS;
var SLOTS = 8;
var SECONDS_PER_SLOT = 0.25;
var SECONDS = SLOTS * SECONDS_PER_SLOT;
var FRAMES = SECONDS * FRAMES_PER_SECOND;
var FRAMES_PER_SLOT = FRAMES_PER_SECOND * SECONDS_PER_SLOT;
var START_NOTE = 50;
var ctrls = findEverything();
var img = new Image();

function chooser(dist, arr){
    return function(){
        var selection = [];
        var d = Math.random();
        var l = 0;
        for(l = 0; l < dist.length; ++l){
            if(dist[l] > d){
                break;
            }
            d -= dist[l];
        }
        for(var j = 0; j < l; ++j){
            var i;
            do{
                i = Math.floor(Math.random() * arr.length);
            }while(selection.indexOf(arr[i]) >= 0);
            selection.push(arr[i]);
        }
        return selection;
    };
}

var liquors = chooser([0, 0.75, 0.25], [
    "gin",
    "vodka",
    "silver rum",
    "bourbon",
    "spiced rum",
    "rye",
    "tequila",
    "scotch",
    "lophroaig"
]);

var baseMixers = [
    "cranberry juice",
    "mango juice",
    "pear juice",
    "carrot juice",
    "pomegranate juice",
    "peach juice",
    "black mulberry juice",
    "orange juice",
    "seltzer",
    "tonic",
    "apple cider"
];

var virginMixers = chooser([0, 0.5, 0.5], baseMixers);

var mixers = chooser([0.25, 0.5, 0.25], baseMixers.concat(
    "elderflower liquer",
    "green chartreuse",
    "yellow chartreuse",
    "sweet vermouth",
    "dry vermouth",
    "baileys",
    "kahlua",
    "cointreau",
    "apple pie moonshine",
    "whipped cream vodka"
));

var bitters = chooser([0, 1], [
    "angostura bitters",
    "hibiscus vanilla bitters",
    "amaretto",
    "grenadine",
    "chocolate bitters",
    "chili bitters",
    "chocolate + chili bitters",
    "orange bitters",
    "cherry vanilla bitters",
    "key lime pie bitters",
    "pear bitters",
    "texas pete"
]);

var tinctures = chooser([0.5, 0.5], [
    "lime juice",
    "lemon juice",
    "lemon + lime juice",
    "rose water",
    "citrus simple syrup",
    "ginger simple syrup",
    "cuccumber simple syrup",
    "simple syrup",
    "maple syrup",
    "agave",
    "honey"
]);

var accoutrement = chooser([0.5, 0.5], [
    "olives",
    "cherries",
    "pearl onions",
    "candied violet",
    "candied ginger",
    "candied citrus",
    "star fruit",
    "pineapple",
    "kiwi",
    "cantaloupe",
    "papaya",
    "lemon peel",
    "lemon slices",
    "lime wedges",
    "pickels",
    "gerhkins",
    "cuccumber",
    "salt",
    "brown sugar",
    "turbinado",
    "nutmeg",
    "cinnamon sticks"
]);

function makeDrink(){
    var drink = [];
    for(var i = 0; i < arguments.length; ++i){
        drink = drink.concat(arguments[i]().sort());
    }
    return drink;
}

var drinks = {
    cocktail: function(){
        return makeDrink(liquors, mixers, bitters, tinctures, accoutrement);
    },
    mocktail: function (){
        return makeDrink(virginMixers, bitters, tinctures, accoutrement);
    }
};

function start(){
    var tileWidth = img.width / COLS;
    var tileHeight = img.height / ROWS;
    function i2xy(i){
        var x = i % COLS;
        var y = Math.floor(i / COLS);
        return fmt("$1px $2px", x * tileWidth, y * tileHeight);
    }
    var slots = [];
    for(var i = 0; i < SLOTS; ++i){
        var slot = document.createElement("div");
        slot.id = "slot" + i;
        ctrls[slot.id] = slot;
        slot.style.display = "inline-block";
        slot.style.backgroundImage = fmt("url($1)", img.src);
        slot.style.backgroundPosition = i2xy(i);
        slot.style.width = px(tileWidth);
        slot.style.height = px(tileHeight);
        slot.style.margin = "1em";
        ctrls.slots.appendChild(slot);
        slots.push(slot);
    }
    addFullScreenShim(ctrls.display);
    var currentFrame = 0;
    function spin(){                
        if(currentFrame < FRAMES){
            if(currentFrame === 0){
                ctrls.output.innerHTML = "";
            }
            setTimeout(spin.bind(this), DT);
            ++currentFrame;
            var n = currentFrame % FRAMES_PER_SLOT;
            var s = Math.floor(currentFrame / FRAMES_PER_SLOT);
            audio.sawtooth(START_NOTE - n + s + 2 * (s % 2) - 1, 1, DT / 1000);
            for(var i = s; i < SLOTS; ++i){
                var t = Math.floor(Math.random() * TILES);
                slots[i].style.backgroundPosition = i2xy(t);
            }
        }
        else{
            currentFrame = 0;
            var drink = drinks[this.id]();
            drink.forEach(function(d){
                var li = document.createElement("li");
                li.appendChild(document.createTextNode(d));
                ctrls.output.appendChild(li);
            });
        }
    }
    ctrls.cocktail.onclick = spin;
    ctrls.mocktail.onclick = spin;
}

addFullScreenShim(ctrls.display);
img.onload = start;
img.src = "img/slots.jpg";