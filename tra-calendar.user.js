// ==UserScript==
// @name        TRA Calendar Shortcut
// @version     1.1.0
// @description Adds Google Calendar shortcut to the Taiwan Railway Administration timetable
// @license     MIT
// @author      Still Hsu
// @include     https://*.railway.gov.tw/*
// @inject-into content
// @downloadUrl https://raw.githubusercontent.com/Still34/tra-shortcut/master/tra-calendar.user.js
// @updateUrl https://raw.githubusercontent.com/Still34/tra-shortcut/master/tra-calendar.user.js
// @grant       GM_openInTab
// ==/UserScript==

const currentPath = document.location.pathname.split('/').pop().toLowerCase();
switch (currentPath) {
    case "orderdetails":
        injectForOrderDetails();
        break;
    case "querybytime":
        injectForTimeQuery();
        break;
}

function getCalendarUri(name, startDate, endDate, fromLocation = undefined, description = undefined) {
    let calendarUri = getBaseCalendarUri();
    calendarUri.searchParams.append('text', name);
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

function injectForOrderDetails() {
    let timeCourseNode = document.querySelector('.time-course');
    if (!timeCourseNode) {
        throw "Failed to find the time-course node."
    }
    let tripDate = timeCourseNode.querySelector('.date').textContent.match(/[\d]{1,2}\/[\d]{1,2}/g);
    let startStation = timeCourseNode.querySelector('.from').textContent;
    let endStation = timeCourseNode.querySelector('.to').textContent;
    let timeCollection = Array.from(timeCourseNode.querySelectorAll('.time')).map(x => {
        return x.textContent.match(/[\d]{1,2}\:[\d]{1,2}/g)[0]
    })
    let currentYear = new Date().getFullYear();
    let rideStartDate = getFormattedDate(new Date(`${currentYear}/${tripDate} ${timeCollection[0]}`));
    let rideEndDate = getFormattedDate(new Date(`${currentYear}/${tripDate} ${timeCollection[1]}`));
    let trainId = document.querySelector('.train-number').textContent.trim();
    let tripName = getFormattedTripName(trainId, startStation, endStation);
    let buttonCell = make({
        el: 'td',
        appendTo: timeCourseNode.parentNode.parentNode
    });
    createCalendarButton(getCalendarUri(tripName, rideStartDate, rideEndDate), buttonCell);
}

function createCalendarButton(calendarUri, appendTo = undefined) {
    let calendarBtn = make({
        el: 'button',
        appendTo: appendTo,
        attr: {
            "calendar-uri": calendarUri
        },
        class: "icon-fa icon-calendar"
    })
    calendarBtn.addEventListener('click', x => {
        GM_openInTab(x.target.getAttribute('calendar-uri'), false);
    })
    return calendarBtn;
}

function getFormattedTripName(rideId, startStation, endStation) {
    return `${rideId}: ${startStation} ➡ ${endStation}`;
}

function injectForTimeQuery() {
    let startStationNode = document.querySelector('input[id="startStation"]');
    let endStationNode = document.querySelector('input[id="endStation"]');
    let tripDateNode = document.querySelector('input[id="rideDate"]');
    if (!startStationNode || !endStationNode || !tripDateNode) {
        throw "Start or end station or trip date nodes cannot be found."
    }
    let stationRegex = /\d{1,4}|-/g;
    let startStation = startStationNode.value.replace(stationRegex, '');
    let endStation = endStationNode.value.replace(stationRegex, '');
    let tripDate = tripDateNode.value;
    document.querySelectorAll('.trip-column').forEach(tripColumn => {
        let rideIdNode = tripColumn.querySelector('a[href*="querybytrainno"]');
        if (!rideIdNode || tripColumn.childElementCount < 3) {
            return;
        }
        let rideId = rideIdNode.textContent;
        let startTime = tripColumn.children[1].textContent;
        let endTime = tripColumn.children[2].textContent;
        let tripName = getFormattedTripName(rideId, startStation, endStation);
        let rideStartDate = getFormattedDate(new Date(`${tripDate} ${startTime}`));
        let rideEndDate = getFormattedDate(new Date(`${tripDate} ${endTime}`));
        let buttonCell = make({
            el: 'td',
            appendTo: tripColumn
        });
        createCalendarButton(getCalendarUri(tripName, rideStartDate, rideEndDate), buttonCell);
    });
}

function getFormattedDate(date) {
    return date
        .toISOString()
        .replace(/[\-|\:|\.]/g, '')
        .replace(/000Z/g, 'Z');
}

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
        let textNode = document.createTextNode(obj.text);
        el.appendChild(textNode);
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