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

function TabSet(id) {
    var elem = id;
    if(typeof(elem) === "string"){
        elem = document.getElementByID(elem);
    }
    if(elem === null){
        throw new Error(fmt("Couldn't find tabset \"$1\"", id));
    }
    if (!/\btabSet\b/.test(elem.className)) {
        elem = elem.querySelector(".tabSet");
    }
    var table = document.createElement("table"),
        header = document.createElement("thead"),
        body = document.createElement("tbody"),
        headerRow = document.createElement("tr"),
        bodyRow = document.createElement("tr"),
        bodyCell = document.createElement("td");
    table.className = "tabSet";
    elem.className = "";
    elem.parentElement.insertBefore(table, elem);
    elem.parentElement.removeChild(elem);
    table.appendChild(header);
    table.appendChild(body);
    header.appendChild(headerRow);
    body.appendChild(bodyRow);
    bodyRow.appendChild(bodyCell);
    var children = arr(elem.children);
    for (var i = 0; i < children.length; i += 2) {
        var title = children[i],
            content = children[i + 1];
        if (/(H\d|LABEL)/.test(title.tagName)) {
            var headerCell = document.createElement("th");
            headerRow.appendChild(headerCell);
            title.parentElement.removeChild(title);
            headerCell.innerHTML = title.innerHTML;
            content.style.width = "100%";
            content.parentElement.removeChild(content);
            bodyCell.appendChild(content);
            if (i > 0) {
                content.style.display = "none";
                headerCell.className = "tab";
            }
            else {
                headerCell.className = "tab selectedTab";
            }
            var selectTab = function (index) {
                for (var n = 0; n < bodyCell.children.length; ++n) {
                    bodyCell.children[n].style.display = (n === index) ? "" : "none";
                    headerRow.children[n].className = (n === index) ? "tab selectedTab" : "tab";
                }
            }.bind(title, i / 2);
            headerCell.addEventListener("click", selectTab);
        }
    }
    for (var i = 0; i < headerRow.children.length; ++i) {
        headerRow.children[i].style.width = pct(100 / headerRow.children.length);
    }
    bodyCell.colSpan = headerRow.children.length;
    this.DOMElement = table;
}

TabSet.makeAll = function(){
    return map(document.querySelectorAll(".tabSet"), function(s){
        return new TabSet(s);
    });
};
