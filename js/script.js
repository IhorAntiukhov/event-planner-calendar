const { localStorage } = window;
const currentPeriodElement = document.querySelector('.period__text');
const calendarScales = ['3 дня', 'Неделя', 'Месяц', '3 месяца', 'Год'];
const eventFilter = []; // Types of events that will not appear on the main calendar

const periodStartDate = new Date();
const periodEndDate = new Date(periodStartDate);
const sideCalendarDate = new Date(periodStartDate);

let calendarScaleOpened = false;
let calendarScale = +(localStorage.getItem('calendarScale'));
calendarScale = calendarScale || 1;

let selectedDate = 0;
let eventTypeOpened = false;
let eventType = 'red-events';
let editEvent = false;
let editableEventIndex = 0;

// Previous time and date of the event before it was edited
let previousTimeOfEvent;
let previousDateOfEvent = '';
let eventElement;

let displayEventsInListMode = false;
let eventsAddedOrChanged = false; // A new event or task has been added while displaying events on the list

let events = (localStorage.getItem('events')) ? JSON.parse(localStorage.getItem('events')) : [];
let country = localStorage.getItem('country'); // get your country code to get national holidays
country = country || 'UA';

const countryElement = document.querySelector('#country');
countryElement.value = country;
countryElement.closest('.add-event__input-group').classList.add('add-event__input-group_select');

document.querySelector('#scale .dropdown__text').innerHTML = calendarScales[calendarScale - 1];

/**
 * Get the name of the month in Russian in the genitive case
 * @param {Date} date The date from which the function get the month
 * @returns {string} Name of the month
 */
const formatMonth = (date) => {
    let month = date.toLocaleString('ru-RU', { month: 'long' });
    if (date.getMonth() === 2 || date.getMonth() === 7) {
        month += 'а';
    } else {
        month = `${month.slice(0, -1)}я`;
    }
    return month;
};

/** 
 * Get the HTML markup of an event
 * @param {object} event Displayed event data
 * @returns {string}
 */
const insertEvent = (event) => {
    let eventDateString = '';
    if (displayEventsInListMode) {
        const eventDate = new Date(event.date);
        eventDateString = `${eventDate.getDate()} ${formatMonth(eventDate)}`;
    }

    let eventTime = '';
    if (!event.isHoliday && !displayEventsInListMode) {
        eventTime = event.time;
    } else if (!event.isHoliday && displayEventsInListMode) {
        eventTime = `${event.time} · ${eventDateString}`;
    } else if (event.isHoliday && !displayEventsInListMode) {
        eventTime = '';
    } else if (event.isHoliday && displayEventsInListMode) {
        eventTime = eventDateString;
    }

    const checkboxId = String(Math.random()).replace('.', ''); // If the event is a task, create the id of the task checkbox
    if (eventFilter.indexOf(event.type) === -1) {
        return `
        <div class="event ${event.type}" ${(!event.isHoliday) ? 'draggable="true"' : ''}>
            <p class="event__time" translate="no">${eventTime}</p>
            ${(!event.eventOrTask) ? `
            <div class="event__task-name">
                <div>
                    <input type="checkbox" id="task${checkboxId}" class="event__checkbox" ${(event.checked) ? 'checked' : ''}>
                    <label for="task${checkboxId}" id="label${checkboxId}" class="event__checkbox-label" time="${event.time}" date="${event.date}"><span class="event__checkbox-button"></span></label>
                </div>
                <p class="event__name" translate="no">${event.name}</p>
            </div>
            ` : `<p class="event__name" translate="no">${event.name}</p>`}
            <button class="event__edit" time="${event.time}" date="${event.date}" ${(event.isHoliday) ? 'style="display: none"' : ''}>
                <img src="img/edit.svg" alt="Изменить" class="button-image">
            </button>
            ${(event.description !== '') ? `
                <div class="event__description">
                    <p class="event__description-text">Описание</p>
                    <button class="small-button toggle-description" description="${event.time}.${event.date}">
                        <img src="img/open-2.svg" alt="Развернуть" class="button-image">
                    </button>
                </div>
                <p translate="no" class="event__description-content" description="${event.time}.${event.date}">${event.description}</p>
                ` : ''}
        </div>`;
    }
    return '';
};

/**
 * Display events for a certain period on the calendar
 * @param {number} changeFactor Scroll forward, backward, or stay on the same calendar page
 * @param {number} timeout If timeout is zero, don't show calendar scroll animation
 */
const displayEvents = (changeFactor, timeout) => {
    const differenceInDays = Math.round((periodEndDate.getTime()
        - periodStartDate.getTime()) / (1000 * 3600 * 24));
    const startDate = new Date(periodStartDate);

    const daysElement = document.querySelector('.days');
    if (timeout === 500) {
        daysElement.classList.remove('days_show');
        daysElement.classList.remove('days_show-reverse');
        if (changeFactor === 1) {
            daysElement.classList.add('days_hide');
        } else if (changeFactor === -1) {
            daysElement.classList.add('days_hide-reverse');
        }
    }

    /**
     * Get HTML markup of holidays or events for a specific day
     * @returns {string} 
     */
    const insertEvents = () => {
        const eventsThatDay = events.filter((value) => {
            const date = new Date(value.date);
            return ((date.getDate() === startDate.getDate()
                && date.getMonth() === startDate.getMonth()
                && date.getFullYear() === startDate.getFullYear() && !value.isHoliday)
                || (date.getDate() === startDate.getDate()
                    && date.getMonth() === startDate.getMonth() && value.isHoliday));
        });

        if (eventsThatDay.length > 0) {
            let eventElements = '';
            eventsThatDay.forEach((value) => {
                eventElements += insertEvent(value);
            });
            return eventElements;
        }
        return '';
    };

    setTimeout(() => {
        daysElement.innerHTML = '';

        // Insert HTML markup of dates and events
        for (let i = 0; i <= differenceInDays; i++) {
            let weekDay = startDate.toLocaleString('ru-RU', { weekday: 'short' });
            weekDay = weekDay[0].toUpperCase() + weekDay.slice(1);

            const eventsForDay = insertEvents();
            daysElement.insertAdjacentHTML('beforeend', `
            <div class="days__item ${(startDate.getDate() === selectedDate && startDate.getMonth() === sideCalendarDate.getMonth()) ? 'days__item_selected' : ''}" date="${startDate.toISOString()}">
                <div class="days__date ${(eventsForDay === '') ? 'days__date_full-height' : ''}">
                    <p class="days__week-day">${weekDay}</p>
                    ${(calendarScale === 4 || calendarScale === 5) ? `<p class="days__month-day"><span translate="no">${startDate.getDate()} </span>${formatMonth(startDate)}</p>`
                    : `<p class="days__month-day" translate="no">${startDate.getDate()}</p>`}
                </div>
                ${(eventsForDay !== '') ? `
                    <div class="days__events">
                        ${eventsForDay}
                    </div>
                ` : ''}
            </div>
            `);

            if (startDate.getDate() === selectedDate && startDate.getMonth() === sideCalendarDate.getMonth()) {
                document.querySelector(`.days__item[date="${startDate.toISOString()}"]`).scrollIntoView(true);
            }
            startDate.setDate(startDate.getDate() + 1);
        }

        if (timeout === 500) {
            if (changeFactor === 1) {
                daysElement.classList.replace('days_hide', 'days_show');
            } else if (changeFactor === -1) {
                daysElement.classList.replace('days_hide-reverse', 'days_show-reverse');
            }
        }
    }, timeout);
};

/**
 * Get time difference between two dates
 * @param {Date} date1 Bigger date 
 * @param {Date} date2 Smaller date
 * @returns {number}
 */
const getDifferenceInMonths = (date1, date2) => {
    const monthDifference = date1.getMonth() - date2.getMonth();
    const yearDifference = date1.getFullYear() - date2.getFullYear();
    return monthDifference + yearDifference * 12;
};

let appJustStarted = true;

/**
 * Scroll the calendar in the sidebar, or update events on it
 * @param {number} changeFactor Scroll forward, backward, or stay on the same calendar page
 */
const changeSideCalendarMonth = (changeFactor) => {
    const sidebarCalendarElement = document.querySelector('.side-calendar__dates');
    sidebarCalendarElement.innerHTML = '<p class="side-calendar__year"></p>';

    if (changeFactor !== 0 || appJustStarted) {
        const previousDate = new Date(sideCalendarDate);
        sideCalendarDate.setMonth(sideCalendarDate.getMonth() + 1 + changeFactor * 1);
        sideCalendarDate.setDate(0);

        if (getDifferenceInMonths(sideCalendarDate, previousDate) >= 2) sideCalendarDate.setDate(0);

        let month = (new Date(sideCalendarDate.getTime())).toLocaleString('ru-RU', { month: 'long' });
        month = month[0].toUpperCase() + month.slice(1);

        document.querySelector('.side-calendar__text').innerHTML = month;
        if (new Date().getFullYear() !== sideCalendarDate.getFullYear()) {
            document.querySelector('.side-calendar__year').innerHTML = sideCalendarDate.getFullYear();
        } else {
            document.querySelector('.side-calendar__year').innerHTML = '';
        }
    }

    for (let i = 1; i <= sideCalendarDate.getDate(); i++) {
        // Get events whose date matches a specific date
        const eventsOnThatDay = events.filter((value) => {
            const eventDate = new Date(value.date);
            return eventDate.getMonth() === sideCalendarDate.getMonth() && eventDate.getDate() === i
                && ((eventDate.getFullYear() === sideCalendarDate.getFullYear()
                    && !value.isHoliday) || value.isHoliday);
        });

        // Get the number of events of each type and find the most frequent event type
        let mostFrequentEventType = '';
        if (eventsOnThatDay.length > 0) {
            const eventTypesFrequency = {};
            eventsOnThatDay.forEach((value) => {
                if (eventTypesFrequency[value.type]) {
                    eventTypesFrequency[value.type] += 1;
                } else {
                    eventTypesFrequency[value.type] = 1;
                }
            });

            let maxFrequency = 0;
            Object.entries(eventTypesFrequency).forEach((value) => {
                if (value[1] > maxFrequency) {
                    [mostFrequentEventType, maxFrequency] = value;
                }
            });
        }

        sidebarCalendarElement.insertAdjacentHTML('beforeend', `
            <button class="side-calendar__day ${mostFrequentEventType}" title="Перейти на ${i} ${formatMonth(sideCalendarDate)}"><span translate="no">${i}</span></button>
        `);
    }
};

changeSideCalendarMonth(0);

// Change the number of dates shown on the main calendar
const setCalendarScale = () => {
    switch (calendarScale) {
        case 1:
            periodEndDate.setTime(periodStartDate.getTime());
            periodEndDate.setDate(periodStartDate.getDate() + 2);
            break;
        case 2:
            if (periodStartDate.getDay() !== 0) {
                periodStartDate.setDate(periodStartDate.getDate() - periodStartDate.getDay() + 1);
            } else {
                periodStartDate.setDate(periodStartDate.getDate() - 6);
            }
            periodEndDate.setTime(periodStartDate.getTime());
            periodEndDate.setDate(periodStartDate.getDate() + 6);
            break;
        case 3:
            periodStartDate.setDate(1);
            periodEndDate.setTime(periodStartDate.getTime());
            periodEndDate.setMonth(periodStartDate.getMonth() + 1);
            periodEndDate.setDate(0);
            break;
        case 4:
            periodStartDate.setDate(1);
            periodEndDate.setTime(periodStartDate.getTime());
            periodEndDate.setMonth(periodStartDate.getMonth() + 3);
            periodEndDate.setDate(0);
            break;
        case 5:
            periodStartDate.setDate(1);
            periodStartDate.setMonth(0);
            periodEndDate.setTime(periodStartDate.getTime());
            periodEndDate.setDate(31);
            periodEndDate.setMonth(11);
            break;
        default:
    }
    currentPeriodElement.innerHTML = `${periodStartDate.getDate()} ${formatMonth(periodStartDate)} - ${periodEndDate.getDate()} ${formatMonth(periodEndDate)}`;
    if (new Date().getFullYear() !== periodStartDate.getFullYear()) {
        document.querySelector('.calendar__year').classList.add('calendar__year_visible');
        document.querySelector('.calendar__year-text').innerHTML = periodStartDate.getFullYear();
    } else {
        document.querySelector('.calendar__year').classList.remove('calendar__year_visible');
    }

    displayEvents(1, (appJustStarted) ? 0 : 500);
    appJustStarted = false;
};

setCalendarScale();

/**
 * Scroll the main calendar
 * @param {number} changeFactor Scroll forward, backward, or stay on the same calendar page
 */
const changeCalendarPeriod = (changeFactor) => {
    switch (calendarScale) {
        case 1:
            periodStartDate.setDate(periodStartDate.getDate() + changeFactor * 3);
            periodEndDate.setDate(periodEndDate.getDate() + changeFactor * 3);
            break;
        case 2:
            periodStartDate.setDate(periodStartDate.getDate() + changeFactor * 7);
            periodEndDate.setDate(periodEndDate.getDate() + changeFactor * 7);
            break;
        case 3:
            periodStartDate.setMonth(periodStartDate.getMonth() + changeFactor * 1);
            periodEndDate.setTime(periodStartDate);
            periodEndDate.setMonth(periodStartDate.getMonth() + 1);
            periodEndDate.setDate(0);
            break;
        case 4:
            periodStartDate.setMonth(periodStartDate.getMonth() + changeFactor * 3);
            periodEndDate.setTime(periodStartDate);
            periodEndDate.setMonth(periodEndDate.getMonth() + 3);
            periodEndDate.setDate(0);
            break;
        case 5:
            periodStartDate.setFullYear(periodStartDate.getFullYear() + changeFactor * 1);
            periodEndDate.setFullYear(periodEndDate.getFullYear() + changeFactor * 1);
            break;
        default:
    }
    currentPeriodElement.innerHTML = `${periodStartDate.getDate()} ${formatMonth(periodStartDate)} - ${periodEndDate.getDate()} ${formatMonth(periodEndDate)}`;

    if (new Date().getFullYear() !== periodStartDate.getFullYear()) {
        document.querySelector('.calendar__year').classList.add('calendar__year_visible');
        document.querySelector('.calendar__year-text').innerHTML = periodStartDate.getFullYear();
    } else {
        document.querySelector('.calendar__year').classList.remove('calendar__year_visible');
    }

    displayEvents(changeFactor, 500);
};

/**
 * Close dropdown menu and save selected item
 * @param {string} dropdownId HTML dropdown id
 * @param {MouseEvent} event DOM event
 */
const closeMenuAndSelectItem = (dropdownId, event) => {
    if (dropdownId === 'scale') {
        calendarScaleOpened = false;
    } else {
        eventTypeOpened = false;
    }
    // Checking each dropdown menu option
    for (let i = 0; i < 5; i++) {
        if (event.target.closest(`#${dropdownId} .dropdown__option:nth-child(${i + 1})`)) {
            const scaleOptionElement = document.querySelector(`#${dropdownId} .dropdown__option:nth-child(${i + 1})`);
            if (dropdownId === 'scale') {
                document.querySelector(`#${dropdownId} .dropdown__text`).innerHTML = scaleOptionElement.innerHTML;
                calendarScale = i + 1;
                setCalendarScale();
                localStorage.setItem('calendarScale', calendarScale);
            } else {
                document.querySelector(`#${dropdownId} .dropdown__text`).innerHTML = scaleOptionElement.querySelector('p').innerHTML;
                const dropdownColorElement = document.querySelector(`#${dropdownId} .dropdown__color`);
                if (dropdownColorElement.classList.length === 2) {
                    dropdownColorElement.classList.remove(dropdownColorElement.classList[1]);
                }
                dropdownColorElement.classList.add(scaleOptionElement.querySelector('.dropdown__color').classList[1]);
                eventType = dropdownColorElement.classList[1];
            }
            break;
        }
    }
    const scaleOptionsElement = document.querySelector(`#${dropdownId} .dropdown__options-wrapper`);
    scaleOptionsElement.classList.remove('dropdown__options-wrapper_open');
    scaleOptionsElement.classList.add('dropdown__options-wrapper_close');
    document.querySelector(`#${dropdownId} .dropdown__toggle`).src = 'img/open.svg';
};

/**
 * Close the dropdown menu to select the scale of the calendar or the dropdown menu to select the type of event
 * @param {string} dropdownId HTML dropdown id
 */
const closeOrOpenMenu = (dropdownId) => {
    let currentMenuOpened = false;
    if (dropdownId === 'scale') {
        calendarScaleOpened = !calendarScaleOpened;
        currentMenuOpened = calendarScaleOpened;
    } else {
        eventTypeOpened = !eventTypeOpened;
        currentMenuOpened = eventTypeOpened;
    }
    const scaleOptionsElement = document.querySelector(`#${dropdownId} .dropdown__options-wrapper`);
    if (currentMenuOpened) {
        scaleOptionsElement.classList.remove('dropdown__options-wrapper_close');
        scaleOptionsElement.classList.add('dropdown__options-wrapper_open');
        document.querySelector(`#${dropdownId} .dropdown__toggle`).src = 'img/close.svg';
    } else {
        scaleOptionsElement.classList.remove('dropdown__options-wrapper_open');
        scaleOptionsElement.classList.add('dropdown__options-wrapper_close');
        document.querySelector(`#${dropdownId} .dropdown__toggle`).src = 'img/open.svg';
    }
};

/**
 * Remove placeholder while typing text in input
 * @callback inputEventCallback
 * @param {Event} event DOM event
 */
const inputEventListener = (event) => {
    if (String(event.target.value).length > 0) {
        event.target.closest('.add-event__input-group').classList.remove('add-event__input-group_deselect');
        event.target.closest('.add-event__input-group').classList.add('add-event__input-group_select');
    } else if (String(event.target.value).length === 0) {
        event.target.closest('.add-event__input-group').classList.replace('add-event__input-group_select', 'add-event__input-group_deselect');
    }
};

// Clear inputs in the event or task creation popup menu
const clearInputs = () => {
    document.querySelector('#eventName').value = '';
    document.querySelector('#eventDescription').value = '';
    document.querySelector('#eventHours').value = '';
    document.querySelector('#eventMinutes').value = '';
    document.querySelector('#eventDay').value = '';
    document.querySelector('#createEvent img').src = '../img/add.svg';
    document.querySelector('#deleteEvent').classList.remove('add-event__delete-event_show');
    editEvent = false;
};

// Show all events in a list 
const displayEventsInList = () => {
    // Distribute events by month
    const eventsInMonths = {};
    events.forEach((value) => {
        if (eventFilter.indexOf(value.type) === -1) {
            let month = (new Date(value.date)).toLocaleString('ru-RU', { month: 'long' });
            month = month[0].toUpperCase() + month.slice(1);
            if (eventsInMonths[month] === undefined) eventsInMonths[month] = [];
            eventsInMonths[month].push(value);
        }
    });
    const eventsInMonthsArray = Object.entries(eventsInMonths);
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    eventsInMonthsArray.sort((a, b) => {
        if (monthNames.indexOf(a[0]) < monthNames.indexOf(b[0])) {
            return -1;
        } if (monthNames.indexOf(a[0]) > monthNames.indexOf(b[0])) {
            return 1;
        }
        return 0;
    });

    // Insert HTML markup of events
    let eventsInMonthElements = '<div class="events-in-list">';
    eventsInMonthsArray.forEach((value) => {
        eventsInMonthElements
            += `<div class="events-in-month">
                    <p class="events-in-month__month">${value[0]}</p>
                    <div class="events-in-month__events">`;

        value[1].forEach((event) => {
            eventsInMonthElements += insertEvent(event);
        });
        eventsInMonthElements += '</div></div>';
    });
    eventsInMonthElements += '</div>';
    document.querySelector('.calendar').insertAdjacentHTML('afterbegin', eventsInMonthElements);

    document.querySelector('.events-in-list').style.display = 'block';
};

/**
 * Get national holidays in your country using the Holidays API
 * @param {boolean} replaceOldHolidays Delete holidays of the previous country
 */
const fetchHolidays = (replaceOldHolidays) => {
    fetch(`https://holidayapi.com/v1/holidays?pretty&key=b592103b-75f9-48bc-8775-13b0c53f4313&country=${countryElement.value.toUpperCase()}&year=2022`)
        .then((response) => response.json())
        .then((response) => {
            if (replaceOldHolidays) {
                events = events.filter((value) => !value.isHoliday);
                country = countryElement.value.toUpperCase();
                localStorage.setItem('country', country);
            }

            response.holidays.forEach((value) => {
                events.push({
                    name: value.name,
                    description: '',
                    type: 'azure-events',
                    time: '00:00',
                    date: value.date,
                    eventOrTask: true,
                    checked: false,
                    isHoliday: true,
                });
            });

            localStorage.setItem('holidaysSaved', '1');
            localStorage.setItem('events', JSON.stringify(events));
            if (replaceOldHolidays) {
                if (displayEventsInListMode) {
                    eventsAddedOrChanged = true;
                    document.querySelector('.events-in-list').remove();
                    displayEventsInList(true);
                } else {
                    displayEvents(0, 0);
                }
            }
            changeSideCalendarMonth(0);
        })
        .catch(() => {
            alert('Не удалось получить праздники в этой стране');
        });
};

if (!localStorage.getItem('holidaysSaved')) fetchHolidays();

// Add or change an event or task on the calendar
const createOrEditEvent = () => {
    const eventNameElement = document.querySelector('#eventName');
    const eventHoursElement = document.querySelector('#eventHours');
    const eventMinutesElement = document.querySelector('#eventMinutes');
    const eventDayElement = document.querySelector('#eventDay');
    const eventMonthElement = document.querySelector('#eventMonth');
    const eventYearElement = document.querySelector('#eventYear');

    if (eventNameElement.value !== '' && eventHoursElement.value !== '' && eventMinutesElement.value !== ''
        && eventDayElement.value !== '' && eventMonthElement.value !== '' && eventYearElement.value !== '') {
        if (+(eventHoursElement.value) >= 0 && +(eventHoursElement.value) <= 23
            && +(eventMinutesElement.value) >= 0 && +(eventMinutesElement.value) <= 59
            && +(eventDayElement.value) >= 0 && +(eventDayElement.value) <= 31
            && +(eventMonthElement.value) >= 1 && +(eventMonthElement.value) <= 12
            && eventYearElement.value.length === 4) {
            const eventDate = `${eventYearElement.value}-${(eventMonthElement.value).padStart(2, '0')}-${(eventDayElement.value).padStart(2, '0')}T00:00:00.0Z`;

            // Check if there is an event with the same time and date
            let sameEventIndex = -1;
            const currentTimeOfEvent = `${eventHoursElement.value.padStart(2, '0')}:${eventMinutesElement.value.padStart(2, '0')}`;
            if (!editEvent || !(previousTimeOfEvent === currentTimeOfEvent && previousDateOfEvent === eventDate)) {
                sameEventIndex = events.findIndex((value) => (value.time === `${eventHoursElement.value.padStart(2, '0')}:${eventMinutesElement.value.padStart(2, '0')}`
                    && value.date === eventDate));
            }

            if (sameEventIndex === -1) {
                // Sort events by time
                const sortEvents = () => {
                    if (events.length >= 2) {
                        events.sort((a, b) => {
                            const firstEventTime = (+(a.time.slice(0, 2)) * 60) + +(a.time.slice(3, 5));
                            const secondEventTime = (+(b.time.slice(0, 2)) * 60) + +(b.time.slice(3, 5));

                            if (firstEventTime < secondEventTime) {
                                return -1;
                            } if (firstEventTime > secondEventTime) {
                                return 1;
                            }
                            return 0;
                        });
                    }
                };

                if (!editEvent) {
                    events.push({
                        name: document.querySelector('#eventName').value,
                        description: document.querySelector('#eventDescription').value,
                        type: eventType,
                        time: `${eventHoursElement.value.padStart(2, '0')}:${eventMinutesElement.value.padStart(2, '0')}`,
                        date: eventDate,
                        eventOrTask: (document.querySelector('#createEvent p').innerHTML === 'Создать событие'),
                        checked: false,
                    });

                    sortEvents();
                } else {
                    events[editableEventIndex].name = document.querySelector('#eventName').value;
                    events[editableEventIndex].description = document.querySelector('#eventDescription').value;
                    events[editableEventIndex].type = eventType;
                    events[editableEventIndex].time = `${eventHoursElement.value.padStart(2, '0')}:${eventMinutesElement.value.padStart(2, '0')}`;
                    events[editableEventIndex].date = eventDate;

                    sortEvents();
                }

                document.querySelector('.add-event-popup').classList.replace('add-event-popup_open', 'add-event-popup_close');
                document.querySelector('#eventName').removeEventListener('input', inputEventListener);
                document.querySelector('#eventDescription').removeEventListener('input', inputEventListener);

                setTimeout(() => {
                    document.querySelector('.add-event-popup').classList.remove('add-event-popup_close');

                    if (!displayEventsInListMode) {
                        // Check if the event is in the current calendar period
                        const isDateInRange = () => {
                            const startDate = new Date(periodStartDate);
                            startDate.setHours(0);
                            startDate.setMinutes(0);
                            startDate.setSeconds(0);
                            startDate.setMilliseconds(0);

                            const endDate = new Date(periodEndDate);
                            endDate.setHours(0);
                            endDate.setMinutes(0);
                            endDate.setSeconds(0);
                            endDate.setMilliseconds(0);

                            const currentDate = new Date(eventDate);
                            currentDate.setHours(0);
                            currentDate.setMinutes(0);
                            currentDate.setSeconds(0);

                            return !((currentDate.getTime() < startDate.getTime()
                                || currentDate.getTime() > endDate.getTime()));
                        };

                        if (!isDateInRange()) {
                            periodStartDate.setTime(new Date(eventDate));
                            setCalendarScale();
                        } else {
                            displayEvents(0, 500);
                        }
                    } else {
                        eventsAddedOrChanged = true;
                        document.querySelector('.events-in-list').remove();
                        displayEventsInList(true);
                    }

                    changeSideCalendarMonth(0);
                    localStorage.setItem('events', JSON.stringify(events));
                }, 500);
            } else {
                alert('Событие с таким же временем и датой уже существует!');
            }
        } else {
            alert('Введите корректное время или дату!');
        }
    } else {
        alert('Вы заполнили не все поля!');
    }
};

/**
 * Create or edit an event when pressing Enter
 * @callback keydownCallback
 * @param {KeyboardEvent} event DOM event
 */
const keydownEventListener = (event) => {
    if (event.code === 'Enter') {
        createOrEditEvent();
    }
};

/**
 * Display a popup menu to create an event or task
 * @param {boolean} eventOrTask Open the menu for creating an event or task
 */
const showAddEventPopup = (eventOrTask) => {
    if (!editEvent) {
        document.querySelector('.add-event__header').innerHTML = `Добавление ${eventOrTask}`;
        document.querySelector('#createEvent p').innerHTML = `Создать ${(eventOrTask === 'события') ? 'событие' : 'задачу'}`;
        document.querySelector('#eventYear').value = periodStartDate.getFullYear();
        document.querySelector('#eventMonth').value = periodStartDate.getMonth() + 1;
    } else {
        document.querySelector('.add-event__header').innerHTML = `Изменение ${eventOrTask}`;
        document.querySelector('#createEvent p').innerHTML = 'Изменить событие';
        document.querySelector('#createEvent img').src = '../img/change.svg';
    }

    document.querySelector('#eventNamePlaceholder').innerHTML = `Название ${eventOrTask}`;
    document.querySelector('#eventDescriptionPlaceholder').innerHTML = `Описание ${eventOrTask}`;
    document.querySelector('#eventTypeHeader').innerHTML = `Тип ${eventOrTask}`;
    document.querySelector('#eventTimeHeader').innerHTML = `Время ${eventOrTask}`;
    document.querySelector('#eventDateHeader').innerHTML = `Дата ${eventOrTask}`;
    document.querySelector('#eventTimeHeader').innerHTML = `Время ${eventOrTask}`;

    document.querySelector('.add-event-popup').classList.add('add-event-popup_open-animation');
    setTimeout(() => {
        document.querySelector('.add-event-popup').classList.replace('add-event-popup_open-animation', 'add-event-popup_open');
    }, 500);

    /**
     * Remove placeholder if input is empty
     * @param {Element} inputElement 
     */
    const updateInputSelection = (inputElement) => {
        if (String(inputElement.value).length > 0) {
            inputElement.closest('.add-event__input-group').classList.remove('add-event__input-group_deselect');
            inputElement.closest('.add-event__input-group').classList.add('add-event__input-group_select');
        } else if (String(inputElement.value).length === 0) {
            inputElement.closest('.add-event__input-group').classList.replace('add-event__input-group_select', 'add-event__input-group_deselect');
        }
    };
    updateInputSelection(document.querySelector('#eventName'));
    updateInputSelection(document.querySelector('#eventDescription'));

    document.querySelector('#eventName').addEventListener('input', inputEventListener);
    document.querySelector('#eventDescription').addEventListener('input', inputEventListener);
    window.addEventListener('keydown', keydownEventListener);
};

// Add an event listener to delegate click events
document.addEventListener('click', (event) => {
    if (selectedDate !== 0) { // remove date highlight
        document.querySelector('.days__item.days__item_selected').classList.add('days__item_deselected');
        selectedDate = 0;
    }
    if (calendarScaleOpened && !event.target.closest('#scale .dropdown__current')) {
        closeMenuAndSelectItem('scale', event);
    } else if (event.target.closest('#scale')) {
        closeOrOpenMenu('scale');
    } else if (event.target.closest('#back')) {
        changeCalendarPeriod(-1);
    } else if (event.target.closest('#forward')) {
        changeCalendarPeriod(1);
    } else if (event.target.closest('#returnToCurrentDate')) {
        periodStartDate.setTime(new Date());
        setCalendarScale();
    } else if (event.target.closest('#displayEventsInList')) {
        displayEventsInListMode = !displayEventsInListMode;
        if (displayEventsInListMode) {
            document.querySelector('#displayEventsInList img').src = '../img/calendar.svg';
            document.querySelector('#displayEventsInList').title = 'Отобразить события на календаре';
            document.querySelector('.days').classList.remove('days_show-events-in-calendar');
            document.querySelector('.days').classList.add('days_hide-events-in-calendar');
            document.querySelector('.period').classList.add('period_hide');
            document.querySelector('#scale').classList.add('period_hide');

            setTimeout(() => {
                displayEventsInList(false);
                document.querySelector('.days').classList.replace('days_hide-events-in-calendar', 'days_display-none');
                document.querySelector('.events-in-list').classList.add('events-in-list_show');
            }, 500);
        } else {
            document.querySelector('#displayEventsInList img').src = '../img/list.svg';
            document.querySelector('#displayEventsInList').title = 'Отобразить события в виде списка';
            document.querySelector('.events-in-list').classList.remove('events-in-list_show');
            document.querySelector('.events-in-list').classList.add('events-in-list_hide');
            document.querySelector('.period').classList.replace('period_hide', 'period_show');
            document.querySelector('#scale').classList.replace('period_hide', 'period_show');

            if (eventsAddedOrChanged) {
                eventsAddedOrChanged = false;
                displayEvents(0, 500);
            }

            setTimeout(() => {
                document.querySelector('.events-in-list').remove();
                document.querySelector('.days').classList.replace('days_display-none', 'days_show-events-in-calendar');
                document.querySelector('.period').classList.remove('period_show');
            }, 500);

            setTimeout(() => {
                document.querySelector('.days').classList.remove('days_show-events-in-calendar');
                document.querySelector('.days').classList.remove(document.querySelector('.days').classList[1]);
            }, 1000);
        }
    } else if (event.target.closest('#sideCalendarBack')) {
        changeSideCalendarMonth(-1);
    } else if (event.target.closest('#sideCalendarForward')) {
        changeSideCalendarMonth(1);
    } else if (event.target.closest('.side-calendar__day')) {
        for (let i = 1; i <= sideCalendarDate.getDate() + 1; i++) {
            if (event.target.closest(`.side-calendar__day:nth-child(${i})`)) {
                periodStartDate.setFullYear(sideCalendarDate.getFullYear());
                periodStartDate.setMonth(sideCalendarDate.getMonth());
                periodStartDate.setDate(i - 1);
                selectedDate = i - 1;
                setCalendarScale();
                break;
            }
        }
    } else if (event.target.closest('#addEvent')) {
        clearInputs();
        showAddEventPopup('события');
    } else if (event.target.closest('#addTask')) {
        clearInputs();
        showAddEventPopup('задачи');
    } else if (event.target.closest('#setCountry')) {
        if (countryElement.value.length > 0 && country !== countryElement.value) fetchHolidays(true);
    } else if (event.target.closest('#closePopup') || event.target.closest('.add-event-popup__shade-area')) {
        document.querySelector('.add-event-popup').classList.replace('add-event-popup_open', 'add-event-popup_close');
        document.querySelector('#eventName').removeEventListener('input', inputEventListener);
        document.querySelector('#eventDescription').removeEventListener('input', inputEventListener);
        window.removeEventListener('keydown', keydownEventListener);

        setTimeout(() => {
            document.querySelector('.add-event-popup').classList.remove('add-event-popup_close');
        }, 500);
    } else if (eventTypeOpened && !event.target.closest('#eventType .dropdown__current')) {
        closeMenuAndSelectItem('eventType', event);
    } else if (event.target.closest('#eventType')) {
        closeOrOpenMenu('eventType');
    } else if (event.target.closest('#createEvent')) {
        createOrEditEvent();
    } else if (event.target.closest('.toggle-description')) {
        const descriptionElement = document.querySelector(`p[description="${event.target.closest('.toggle-description').getAttribute('description')}"]`);
        if (descriptionElement.classList.contains('event__description-content_show')) {
            descriptionElement.classList.replace('event__description-content_show', 'event__description-content_hide');
            event.target.closest('.toggle-description').querySelector('.button-image').src = 'img/open-2.svg';
            setTimeout(() => {
                descriptionElement.classList.remove('event__description-content_hide');
            }, 250);
        } else {
            descriptionElement.classList.add('event__description-content_show');
            event.target.closest('.toggle-description').querySelector('.button-image').src = 'img/close-2.svg';
        }
    } else if (event.target.closest('.event__edit')) {
        eventElement = event.target.closest('.event');
        const eventTime = event.target.closest('.event__edit').getAttribute('time');
        const eventDate = event.target.closest('.event__edit').getAttribute('date');

        editableEventIndex = events.findIndex((value) => value.time === eventTime && value.date === eventDate);
        const editableEvent = events[editableEventIndex];
        document.querySelector('#eventName').value = editableEvent.name;
        document.querySelector('#eventDescription').value = editableEvent.description;

        document.querySelector('#eventType .dropdown__text').innerHTML = document.querySelector(`.dropdown__option .dropdown__color.${editableEvent.type} + p`).innerHTML;
        const dropdownColorElement = document.querySelector('#eventType .dropdown__color');
        dropdownColorElement.classList.remove(dropdownColorElement.classList[1]);
        dropdownColorElement.classList.add(editableEvent.type);
        eventType = editableEvent.type;

        document.querySelector('#eventHours').value = editableEvent.time.slice(0, 2);
        document.querySelector('#eventMinutes').value = editableEvent.time.slice(3, 5);

        const editableEventDate = new Date(editableEvent.date);

        document.querySelector('#eventDay').value = editableEventDate.getDate();
        document.querySelector('#eventMonth').value = editableEventDate.getMonth() + 1;
        document.querySelector('#eventYear').value = editableEventDate.getFullYear();

        editEvent = true;
        previousTimeOfEvent = editableEvent.time;
        previousDateOfEvent = editableEvent.date;

        document.querySelector('#deleteEvent').classList.add('add-event__delete-event_show');
        showAddEventPopup((editableEventDate.eventOrTask) ? 'события' : 'задачи');
    } else if (event.target.closest('#deleteEvent')) {
        events.splice(editableEventIndex, 1);
        localStorage.setItem('events', JSON.stringify(events));

        document.querySelector('.add-event-popup').classList.replace('add-event-popup_open', 'add-event-popup_close');
        document.querySelector('#eventName').removeEventListener('input', inputEventListener);
        document.querySelector('#eventDescription').removeEventListener('input', inputEventListener);

        setTimeout(() => {
            document.querySelector('.add-event-popup').classList.remove('add-event-popup_close');

            if (eventElement.parentElement.children.length > 1) {
                eventElement.remove();
            } else {
                eventElement.parentElement.previousElementSibling.classList.add('days__date_full-height');
                eventElement.parentElement.remove();
            }
        }, 500);
    } else if (event.target.closest('label[id^="label"]')) {
        const labelElement = event.target.closest('label[id^="label"]');
        const eventIndex = events.findIndex((value) => value.time === labelElement.getAttribute('time') && value.date === labelElement.getAttribute('date'));
        const checkboxElement = document.querySelector(`#task${labelElement.id.slice(5).replace('.', '')}`);
        events[eventIndex].checked = !checkboxElement.checked;
        localStorage.setItem('events', JSON.stringify(events));
    } else if (event.target.closest('#openSidebar')) {
        document.querySelector('.sidebar').classList.add('sidebar_show');
        document.querySelector('.content__shade-area').classList.add('content__shade-area_show');
    } else if (event.target.closest('#closeSidebar')) {
        document.querySelector('.sidebar').classList.replace('sidebar_show', 'sidebar_hide');
        document.querySelector('.content__shade-area').classList.replace('content__shade-area_show', 'content__shade-area_hide');

        setTimeout(() => {
            document.querySelector('.sidebar').classList.remove('sidebar_hide');
            document.querySelector('.content__shade-area').classList.remove('content__shade-area_hide');
        }, 500);
    }
});

// Add an event filtering checkbox change listener
document.querySelector('.sidebar').addEventListener('change', (event) => {
    const checkboxElement = event.target.closest('.sidebar__checkbox');
    if (checkboxElement) {
        if (!checkboxElement.checked) {
            eventFilter.push(checkboxElement.getAttribute('eventtype'));
        } else {
            eventFilter.splice(eventFilter.indexOf(checkboxElement.getAttribute('eventtype')), 1);
        }
        if (displayEventsInListMode) {
            eventsAddedOrChanged = true;
            document.querySelector('.events-in-list').remove();
            displayEventsInList(true);
        } else {
            displayEvents(0, 0);
        }
    }
});

// Add listeners for the event being dragged from one date to another

document.querySelector('.days').addEventListener('dragstart', (event) => {
    event.dataTransfer.effectAllowed = 'move';
    const editEventElement = event.target.querySelector('.event__edit');
    const eventIndex = events.findIndex((value) => value.time === editEventElement.getAttribute('time') && value.date === editEventElement.getAttribute('date'));
    event.dataTransfer.setData('text/plain', String(eventIndex));
});

document.querySelector('.days').addEventListener('dragover', (event) => {
    if (event.target.closest('.days__item')) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }
});

document.querySelector('.days').addEventListener('drop', (event) => {
    if (event.target.closest('.days__item')) {
        event.preventDefault();
        const eventIndex = event.dataTransfer.getData('text/plain');
        const eventDate = event.target.closest('.days__item').getAttribute('date');
        events[eventIndex].date = `${eventDate.slice(0, 11)}00:00:00.0Z`;
        displayEvents(0, 0);
        changeSideCalendarMonth(0);
        localStorage.setItem('events', JSON.stringify(events));
    }
});
