// ==UserScript==
// @name        TRA Calendar Shortcut
// @version     1.0.3
// @description Adds Google Calendar shortcut to the Taiwan Railway Administration timetable
// @license     MIT
// @author      Still Hsu
// @include     https://*.railway.gov.tw/tra-tip-web/*/*/*/querybytime
// @inject-into content
// @downloadUrl https://raw.githubusercontent.com/Still34/tra-shortcut/master/tra-calendar.user.js
// @updateUrl https://raw.githubusercontent.com/Still34/tra-shortcut/master/tra-calendar.user.js
// @grant GM_openInTab
// ==/UserScript==

const stationRegex = /\d{1,4}|-/g;
const dateRegex = /[\-|\:|\.]/g;

function getCalendarUri(name, startDate, endDate, fromLocation = undefined, description = undefined) {
    let calendarUri = getBaseCalendarUri();
    calendarUri.searchParams.append('text', name);
    startDate = startDate.replace(/000Z/g, 'Z');
    endDate = endDate.replace(/000Z/g, 'Z');
    calendarUri.searchParams.append('dates', `${startDate}/${endDate}`);
    if (description) {
        calendarUri.searchParams.append('details', description)
    }
    if (fromLocation) {
        calendarUri.searchParams.append('location', fromLocation);
    }
    return calendarUri.href;
}

function getBaseCalendarUri() {
    return new URL('https://calendar.google.com/calendar/render?action=TEMPLATE&ctz=Asia/Taipei');
}

function injectButtons() {
    const startStationNode = document.querySelector('input[id="startStation"]');
    const endStationNode = document.querySelector('input[id="endStation"]');
    const tripDateNode = document.querySelector('input[id="rideDate"]');
    if (!startStationNode || !endStationNode || !tripDateNode) {
        throw "Start or end station or trip date nodes cannot be found."
    }
    const startStation = startStationNode.value.replace(stationRegex, '');
    const endStation = endStationNode.value.replace(stationRegex, '');
    const tripDate = tripDateNode.value;
    document.querySelectorAll('.trip-column').forEach(tripColumn => {
        let rideIdNode = tripColumn.querySelector('a[href*="querybytrainno"]');
        if (!rideIdNode) {
            throw "Ride ID node not found."
        }
        let rideId = rideIdNode.textContent;
        let startTime = tripColumn.children[1].textContent;
        let endTime = tripColumn.children[2].textContent;
        let tripName = `${rideId} ➡ ${endStation}`;
        let rideStartDate = new Date(`${tripDate} ${startTime}`).toISOString().replace(dateRegex, '');
        let rideEndDate = new Date(`${tripDate} ${endTime}`).toISOString().replace(dateRegex, '');
        let buttonCell = make({ el: 'td', appendTo: tripColumn });
        let calendarBtn = make({
            el: 'button',
            appendTo: buttonCell,
            attr: {
                "calendar-uri": getCalendarUri(tripName, rideStartDate, rideEndDate, `${startStation} Train Station`)
            },
            class: "icon-fa icon-calendar"
        })
        calendarBtn.addEventListener('click', x => {
            GM_openInTab(x.target.getAttribute('calendar-uri'), false);
        })
    });
}

injectButtons();

// Based on GitHub Dark
// https://github.com/StylishThemes/GitHub-Dark/blob/master/LICENSE
function make(obj) {
    let key,
        el = document.createElement(obj.el);
    if (obj.id) {
        el.id = obj.id;
    }
    if (obj.class) {
        el.className = obj.class;
    }
    if (obj.text) {
        let textnode = document.createTextNode(obj.text);
        el.appendChild(textnode);
    }
    if (obj.html) {
        el.innerHTML = obj.html;
    }
    if (obj.attr) {
        for (key in obj.attr) {
            if (obj.attr.hasOwnProperty(key)) {
                el.setAttribute(key, obj.attr[key]);
            }
        }
    }
    if (obj.appendTo) {
        (obj.appendTo).appendChild(el);
    }
    return el;
}