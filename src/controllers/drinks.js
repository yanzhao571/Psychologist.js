var fmt = require("../core").fmt,
    fs = require("fs");
    
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
    "kaluha",
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

var accouterment = chooser([0.5, 0.5], [
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
        return makeDrink(liquors, mixers, bitters, tinctures, accouterment);
    },
    mocktail: function (){
        return makeDrink(virginMixers, bitters, tinctures, accouterment);
    }
};

module.exports = {
    path: "drinks",
    pattern: /^\/drinks\/((?:m|c)ocktail)$/,
    GET: function(params, sendData, sendStaticFile, serverError){
        var data = JSON.stringify(drinks[params[0]]());
        sendData("text/json", data, data.length);
    }
};