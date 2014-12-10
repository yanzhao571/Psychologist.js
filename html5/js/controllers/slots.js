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