"use strict"

const localStorage = window.localStorage
const currentPeriodElement = document.querySelector(".period__text")

let calendarScaleOpened = false
let calendarScale = +(localStorage.getItem("calendarScale"))
let selectedDate = 0
let appJustLaunched = true
let eventTypeOpened = false
let eventType = "red-events"
calendarScale = calendarScale || 1
let editEvent = false
let editableEventIndex = 0
let previousTimeOfEvent, previousDateOfEvent = ""
const calendarScales = ["3 дня", "Неделя", "Месяц", "3 месяца", "Год"]
const events = []

document.querySelector("#scale .dropdown__text").innerHTML = calendarScales[calendarScale - 1]

const formatMonth = (date) => {
    let month = date.toLocaleString("ru-RU", { month: "long" })
    if (date.getMonth() == 2 || date.getMonth() == 7) {
        month += "а"
    } else {
        month = month.slice(0, -1) + "я"
    }
    return month
}

const periodStartDate = new Date()
const periodEndDate = new Date(periodStartDate)
const sideCalendarDate = new Date(periodStartDate)

const getDifferenceInMonths = (date1, date2) => {
    const monthDifference = date1.getMonth() - date2.getMonth()
    const yearDifference = date1.getFullYear() - date2.getFullYear()
    return monthDifference + yearDifference * 12
}

const changeSideCalendarMonth = (changeFactor) => {
    const previousDate = new Date(sideCalendarDate)
    sideCalendarDate.setMonth(sideCalendarDate.getMonth() + 1 + changeFactor * 1)
    sideCalendarDate.setDate(0)

    if (getDifferenceInMonths(sideCalendarDate, previousDate) >= 2) sideCalendarDate.setDate(0)

    let month = (new Date(sideCalendarDate.getTime())).toLocaleString("ru-RU", { month: "long" })
    month = month[0].toUpperCase() + month.slice(1)

    const sidebarCalendarElement = document.querySelector(".side-calendar__dates")
    sidebarCalendarElement.innerHTML = '<p class="side-calendar__year"></p>'
    document.querySelector(".side-calendar__text").innerHTML = month
    if (new Date().getFullYear() != sideCalendarDate.getFullYear()) {
        document.querySelector(".side-calendar__year").innerHTML = sideCalendarDate.getFullYear()
    } else {
        document.querySelector(".side-calendar__year").innerHTML = ""
    }

    for (let i = 1; i <= sideCalendarDate.getDate(); i++) {
        sidebarCalendarElement.insertAdjacentHTML("beforeend", `
            <button class="side-calendar__day" title="Перейти на ${i} ${formatMonth(sideCalendarDate)}"><span translate="no">${i}</span></button>
        `)
    }
}

changeSideCalendarMonth(0)

const displayEvents = (changeFactor) => {
    let differenceInDays = Math.round((periodEndDate.getTime() - periodStartDate.getTime()) / (1000 * 3600 * 24))
    let startDate = new Date(periodStartDate)

    const daysElement = document.querySelector(".days")
    let timeout = 0
    if (!appJustLaunched) {
        daysElement.classList.remove("days_show")
        daysElement.classList.remove("days_show-reverse")
        if (changeFactor === 1) {
            daysElement.classList.add("days_hide")
        } else if (changeFactor === -1) {
            daysElement.classList.add("days_hide-reverse")
        }
        timeout = 500
    }

    const insertEvents = () => {
        const suitableEvents = events.filter((eventDate) => {
            const date = new Date(eventDate.date)
            return (date.getDate() == startDate.getDate() && date.getMonth() == startDate.getMonth()
                && date.getFullYear() == startDate.getFullYear())
        })

        if (suitableEvents.length > 0) {
            let eventElements = ""
            suitableEvents.forEach((value) => {
                eventElements += `
                <div class="event ${value.type}">
                    <p class="event__time" translate="no">${value.time}</p>
                    <p class="event__name" translate="no">${value.name}</p>
                    <button time="${value.time}" date="${value.date}" class="event__edit edit">
                        <img src="img/edit.svg" alt="Изменить" class="button-image">
                    </button>
                    ${(value.description !== "") ? `
                    <div class="event__description">
                        <p class="event__description-text">Описание</p>
                        <button description="${value.time}.${value.date}" class="small-button toggle-description">
                            <img src="img/open-2.svg" alt="Развернуть" class="button-image">
                        </button>
                    </div>
                    <p description="${value.time}.${value.date}" translate="no" class="event__description-content">${value.description}</p>
                    ` : ""}
                </div>
                `
            })
            return eventElements
        } else {
            return ""
        }
    }

    setTimeout(() => {
        daysElement.innerHTML = ""

        for (let i = 0; i <= differenceInDays; i++) {
            let weekDay = startDate.toLocaleString("ru-RU", { weekday: "short" })
            weekDay = weekDay[0].toUpperCase() + weekDay.slice(1)

            const eventsForDay = insertEvents()
            daysElement.insertAdjacentHTML("beforeend", `
            <div class="days__item ${(startDate.getDate() == selectedDate) ? "days__item_selected" : ""}">
                <div class="days__date ${(eventsForDay == "") ? "days__date_full-height" : ""}">
                    <p class="days__week-day">${weekDay}</p>
                    <p class="days__month-day" translate="no">${startDate.getDate()}</p>
                </div>
                ${(eventsForDay != "") ? `
                    <div class="days__events">
                        ${eventsForDay}
                    </div>
                ` : ""}
            </div>
            `)
            startDate.setDate(startDate.getDate() + 1)
            if (!appJustLaunched) {
                if (changeFactor === 1) {
                    daysElement.classList.replace("days_hide", "days_show")
                } else if (changeFactor === -1) {
                    daysElement.classList.replace("days_hide-reverse", "days_show-reverse")
                }
            }
            appJustLaunched = false
        }
    }, timeout)
}

const setCalendarScale = () => {
    switch (calendarScale) {
        case 1:
            periodEndDate.setTime(periodStartDate.getTime())
            periodEndDate.setDate(periodStartDate.getDate() + 2)
            break
        case 2:
            if (periodStartDate.getDay() !== 0) {
                periodStartDate.setDate(periodStartDate.getDate() - periodStartDate.getDay() + 1)
            } else {
                periodStartDate.setDate(periodStartDate.getDate() - 6)
            }
            periodEndDate.setTime(periodStartDate.getTime())
            periodEndDate.setDate(periodStartDate.getDate() + 6)
            break
        case 3:
            periodStartDate.setDate(1)
            periodEndDate.setTime(periodStartDate.getTime())
            periodEndDate.setMonth(periodStartDate.getMonth() + 1)
            periodEndDate.setDate(0)
            break
        case 4:
            periodStartDate.setDate(1)
            periodEndDate.setTime(periodStartDate.getTime())
            periodEndDate.setMonth(periodStartDate.getMonth() + 3)
            periodEndDate.setDate(0)
            break
        case 5:
            periodStartDate.setDate(1)
            periodStartDate.setMonth(0)
            periodEndDate.setTime(periodStartDate.getTime())
            periodEndDate.setDate(31)
            periodEndDate.setMonth(11)
            break
    }
    currentPeriodElement.innerHTML = `${periodStartDate.getDate()} ${formatMonth(periodStartDate)} - ${periodEndDate.getDate()} ${formatMonth(periodEndDate)}`
    if (new Date().getFullYear() != periodStartDate.getFullYear()) {
        document.querySelector(".calendar__year").classList.add("calendar__year_visible")
        document.querySelector(".calendar__year-text").innerHTML = periodStartDate.getFullYear()
    } else {
        document.querySelector(".calendar__year").classList.remove("calendar__year_visible")
    }

    displayEvents(1)
}

setCalendarScale()

const changeCalendarPeriod = (changeFactor) => {
    switch (calendarScale) {
        case 1:
            periodStartDate.setDate(periodStartDate.getDate() + changeFactor * 3)
            periodEndDate.setDate(periodEndDate.getDate() + changeFactor * 3)
            break
        case 2:
            periodStartDate.setDate(periodStartDate.getDate() + changeFactor * 7)
            periodEndDate.setDate(periodEndDate.getDate() + changeFactor * 7)
            break
        case 3:
            periodStartDate.setMonth(periodStartDate.getMonth() + changeFactor * 1)
            periodEndDate.setTime(periodStartDate)
            periodEndDate.setMonth(periodStartDate.getMonth() + 1)
            periodEndDate.setDate(0)
            break
        case 4:
            periodStartDate.setMonth(periodStartDate.getMonth() + changeFactor * 3)
            periodEndDate.setTime(periodStartDate)
            periodEndDate.setMonth(periodEndDate.getMonth() + 3)
            periodEndDate.setDate(0)
            break
        case 5:
            periodStartDate.setFullYear(periodStartDate.getFullYear() + changeFactor * 1)
            periodEndDate.setFullYear(periodEndDate.getFullYear() + changeFactor * 1)
            break
    }
    currentPeriodElement.innerHTML = `${periodStartDate.getDate()} ${formatMonth(periodStartDate)} - ${periodEndDate.getDate()} ${formatMonth(periodEndDate)}`

    if (new Date().getFullYear() != periodStartDate.getFullYear()) {
        document.querySelector(".calendar__year").classList.add("calendar__year_visible")
        document.querySelector(".calendar__year-text").innerHTML = periodStartDate.getFullYear()
    } else {
        document.querySelector(".calendar__year").classList.remove("calendar__year_visible")
    }

    displayEvents(changeFactor)
}

const closeMenuAndSelectItem = (dropdownId, event) => {
    if (dropdownId == "scale") {
        calendarScaleOpened = false
    } else {
        eventTypeOpened = false
    }
    for (let i = 0; i < 5; i++) {
        if (event.target.closest(`#${dropdownId} .dropdown__option:nth-child(${i + 1})`)) {
            const scaleOptionElement = document.querySelector(`#${dropdownId} .dropdown__option:nth-child(${i + 1})`)
            if (dropdownId == "scale") {
                document.querySelector(`#${dropdownId} .dropdown__text`).innerHTML = scaleOptionElement.innerHTML
                calendarScale = i + 1
                setCalendarScale()
                localStorage.setItem("calendarScale", calendarScale)
            } else {
                document.querySelector(`#${dropdownId} .dropdown__text`).innerHTML = scaleOptionElement.querySelector("p").innerHTML
                const dropdownColorElement = document.querySelector(`#${dropdownId} .dropdown__color`)
                if (dropdownColorElement.classList.length == 2) {
                    dropdownColorElement.classList.remove(dropdownColorElement.classList[1])
                }
                dropdownColorElement.classList.add(scaleOptionElement.querySelector(".dropdown__color").classList[1])
                eventType = dropdownColorElement.classList[1]
            }
            break
        }
    }
    const scaleOptionsElement = document.querySelector(`#${dropdownId} .dropdown__options-wrapper`)
    scaleOptionsElement.classList.remove(`dropdown__options-wrapper_open`)
    scaleOptionsElement.classList.add(`dropdown__options-wrapper_close`)
    document.querySelector(`#${dropdownId} .dropdown__toggle`).src = "img/open.svg"
}

const closeOrOpenMenu = (dropdownId) => {
    let currentMenuOpened = false
    if (dropdownId == "scale") {
        calendarScaleOpened = !calendarScaleOpened
        currentMenuOpened = calendarScaleOpened
    } else {
        eventTypeOpened = !eventTypeOpened
        currentMenuOpened = eventTypeOpened
    }
    const scaleOptionsElement = document.querySelector(`#${dropdownId} .dropdown__options-wrapper`)
    if (currentMenuOpened) {
        scaleOptionsElement.classList.remove(`dropdown__options-wrapper_close`)
        scaleOptionsElement.classList.add(`dropdown__options-wrapper_open`)
        document.querySelector(`#${dropdownId} .dropdown__toggle`).src = "img/close.svg"
    } else {
        scaleOptionsElement.classList.remove(`dropdown__options-wrapper_open`)
        scaleOptionsElement.classList.add(`dropdown__options-wrapper_close`)
        document.querySelector(`#${dropdownId} .dropdown__toggle`).src = "img/open.svg"
    }
}

const inputEventListener = (event) => {
    if (String(event.target.value).length > 0) {
        event.target.closest(".add-event__input-group").classList.remove("add-event__input_deselect")
        event.target.closest(".add-event__input-group").classList.add("add-event__input_select")
    } else if (String(event.target.value).length === 0) {
        event.target.closest(".add-event__input-group").classList.replace("add-event__input_select", "add-event__input_deselect")
    }
}

const createOrEditEvent = () => {
    if (document.querySelector("#eventName").value != "" && document.querySelector("#eventHours").value != ""
        && document.querySelector("#eventMinutes").value != "" && document.querySelector("#eventDay").value != ""
        && document.querySelector("#eventMonth").value != "" && document.querySelector("#eventYear").value != "") {

        if (+(document.querySelector("#eventHours").value) >= 0 && +(document.querySelector("#eventHours").value) <= 23
            && +(document.querySelector("#eventMinutes").value) >= 0 && +(document.querySelector("#eventMinutes").value) <= 59
            && +(document.querySelector("#eventDay").value) >= 0 && +(document.querySelector("#eventDay").value) <= 31
            && +(document.querySelector("#eventMonth").value) >= 1 && +(document.querySelector("#eventMonth").value) <= 12
            && document.querySelector("#eventYear").value.length == 4) {

            const eventDate = `${document.querySelector("#eventYear").value}-${(document.querySelector("#eventMonth").value).padStart(2, "0")}-${(document.querySelector("#eventDay").value).padStart(2, "0")}T00:00:00.0Z`

            let sameEventIndex = -1
            const currentTimeOfEvent = `${document.querySelector("#eventHours").value.padStart(2, "0")}:${document.querySelector("#eventMinutes").value.padStart(2, "0")}`
            if (!editEvent || !(previousTimeOfEvent == currentTimeOfEvent && previousDateOfEvent == eventDate)) {
                sameEventIndex = events.findIndex((value) => {
                    return (value.time == `${document.querySelector("#eventHours").value.padStart(2, "0")}:${document.querySelector("#eventMinutes").value.padStart(2, "0")}`
                        && value.date == eventDate)
                })
            }

            if (sameEventIndex === -1) {
                const sortEvents = () => {
                    if (events.length >= 2) {
                        events.sort((a, b) => {
                            const firstEventTime = (+(a.time.slice(0, 2)) * 60) + +(a.time.slice(3, 5))
                            const secondEventTime = (+(b.time.slice(0, 2)) * 60) + +(b.time.slice(3, 5))

                            if (firstEventTime < secondEventTime) {
                                return -1
                            } else if (firstEventTime > secondEventTime) {
                                return 1
                            } else {
                                return 0
                            }
                        })
                    }
                }

                if (!editEvent) {
                    events.push({
                        name: document.querySelector("#eventName").value,
                        description: document.querySelector("#eventDescription").value,
                        type: eventType,
                        time: `${document.querySelector("#eventHours").value.padStart(2, "0")}:${document.querySelector("#eventMinutes").value.padStart(2, "0")}`,
                        date: eventDate,
                    })

                    sortEvents()
                } else {
                    events[editableEventIndex].name = document.querySelector("#eventName").value
                    events[editableEventIndex].description = document.querySelector("#eventDescription").value
                    events[editableEventIndex].type = eventType
                    events[editableEventIndex].time = `${document.querySelector("#eventHours").value.padStart(2, "0")}:${document.querySelector("#eventMinutes").value.padStart(2, "0")}`
                    events[editableEventIndex].date = eventDate

                    sortEvents()
                }

                document.querySelector(".add-event-popup").classList.replace("add-event-popup_open", "add-event-popup_close")
                document.querySelector("#eventName").removeEventListener("input", inputEventListener)
                document.querySelector("#eventDescription").removeEventListener("input", inputEventListener)

                setTimeout(() => {
                    document.querySelector(".add-event-popup").classList.remove("add-event-popup_close")

                    const isDateInRange = () => {
                        const startDate = new Date(periodStartDate)
                        startDate.setHours(0)
                        startDate.setMinutes(0)
                        startDate.setSeconds(0)

                        const endDate = new Date(periodEndDate)
                        endDate.setHours(0)
                        endDate.setMinutes(0)
                        endDate.setSeconds(0)

                        const currentDate = new Date(eventDate)
                        currentDate.setHours(0)
                        currentDate.setMinutes(0)
                        currentDate.setSeconds(0)

                        return (currentDate.getTime() < startDate.getTime() || currentDate.getTime() > endDate.getTime()) ? false : true
                    }

                    if (!isDateInRange()) {
                        periodStartDate.setTime(new Date(eventDate))
                        setCalendarScale()
                    } else {
                        displayEvents(0)
                    }
                }, 500)
            } else {
                alert("Событие с таким же временем и датой уже существует!")
            }
        } else {
            alert("Введите корректное время или дату!")
        }
    } else {
        alert("Вы заполнили не все поля!")
    }
}

const keydownEventListener = (event) => {
    if (event.code == "Enter") {
        createOrEditEvent()
    }
}

const showAddEventPopup = () => {
    if (!editEvent) {
        document.querySelector("#createEvent p").innerHTML = "Создать событие"
        document.querySelector("#eventYear").value = periodStartDate.getFullYear()
        document.querySelector("#eventMonth").value = periodStartDate.getMonth() + 1
    } else {
        document.querySelector("#createEvent p").innerHTML = "Изменить событие"
    }

    document.querySelector(".add-event-popup").classList.add("add-event-popup_open-animation")
    setTimeout(() => {
        document.querySelector(".add-event-popup").classList.replace("add-event-popup_open-animation", "add-event-popup_open")
    }, 500)

    document.querySelector("#eventName").addEventListener("input", inputEventListener)
    document.querySelector("#eventDescription").addEventListener("input", inputEventListener)
    window.addEventListener("keydown", keydownEventListener)
}

document.addEventListener("click", (event) => {
    if (selectedDate != 0) {
        document.querySelector(".days__item_selected").classList.add("days__item_deselected")
        selectedDate = 0
    }
    if (calendarScaleOpened && !event.target.closest("#scale .dropdown__current")) {
        closeMenuAndSelectItem("scale", event)
    } else if (event.target.closest("#scale")) {
        closeOrOpenMenu("scale")
    } else if (event.target.closest("#back")) {
        changeCalendarPeriod(-1)
    } else if (event.target.closest("#forward")) {
        changeCalendarPeriod(1)
    } else if (event.target.closest("#returnToCurrentDate")) {
        periodStartDate.setTime(new Date())
        setCalendarScale()
    } else if (event.target.closest("#sideCalendarBack")) {
        changeSideCalendarMonth(-1)
    } else if (event.target.closest("#sideCalendarForward")) {
        changeSideCalendarMonth(1)
    } else if (event.target.closest(".side-calendar__day")) {
        for (let i = 1; i <= sideCalendarDate.getDate() + 1; i++) {
            if (event.target.closest(`.side-calendar__day:nth-child(${i})`)) {
                periodStartDate.setMonth(sideCalendarDate.getMonth())
                periodStartDate.setDate(i - 1)
                selectedDate = i - 1
                setCalendarScale()
                break
            }
        }
    } else if (event.target.closest("#addEvent")) {
        editEvent = false
        showAddEventPopup()
    } else if (event.target.closest("#closePopup") || event.target.closest(".add-event-popup__shade-area")) {
        document.querySelector(".add-event-popup").classList.replace("add-event-popup_open", "add-event-popup_close")
        document.querySelector("#eventName").removeEventListener("input", inputEventListener)
        document.querySelector("#eventDescription").removeEventListener("input", inputEventListener)
        window.removeEventListener("keydown", keydownEventListener)

        setTimeout(() => {
            document.querySelector(".add-event-popup").classList.remove("add-event-popup_close")
        }, 500)
    } else if (eventTypeOpened && !event.target.closest("#eventType .dropdown__current")) {
        closeMenuAndSelectItem("eventType", event)
    } else if (event.target.closest("#eventType")) {
        closeOrOpenMenu("eventType")
    } else if (event.target.closest("#createEvent")) {
        createOrEditEvent()
    } else if (event.target.closest(".toggle-description")) {
        const descriptionElement = document.querySelector(`p[description="${event.target.closest(".toggle-description").getAttribute("description")}"]`)
        if (descriptionElement.classList.contains("event__description-content_show")) {
            descriptionElement.classList.replace("event__description-content_show", "event__description-content_hide")
            event.target.closest(".toggle-description").querySelector(".button-image").src = "img/open-2.svg"
            setTimeout(() => {
                descriptionElement.classList.remove("event__description-content_hide")
            }, 250)
        } else {
            descriptionElement.classList.add("event__description-content_show")
            event.target.closest(".toggle-description").querySelector(".button-image").src = "img/close-2.svg"
        }
    } else if (event.target.closest(".edit")) {
        const eventTime = event.target.closest(".edit").getAttribute("time")
        const eventDate = event.target.closest(".edit").getAttribute("date")

        editableEventIndex = events.findIndex((value) => value.time == eventTime && value.date == eventDate)
        const editableEvent = events[editableEventIndex]
        document.querySelector("#eventName").value = editableEvent.name
        document.querySelector("#eventDescription").value = editableEvent.description

        document.querySelector(`#eventType .dropdown__text`).innerHTML = document.querySelector(`.dropdown__option .dropdown__color.${editableEvent.type} + p`).innerHTML
        const dropdownColorElement = document.querySelector(`#eventType .dropdown__color`)
        dropdownColorElement.classList.remove(dropdownColorElement.classList[1])
        dropdownColorElement.classList.add(editableEvent.type)
        eventType = editableEvent.type

        document.querySelector("#eventHours").value = editableEvent.time.slice(0, 2)
        document.querySelector("#eventMinutes").value = editableEvent.time.slice(3, 5)

        const editableEventDate = new Date(editableEvent.date)

        document.querySelector("#eventDay").value = editableEventDate.getDate()
        document.querySelector("#eventMonth").value = editableEventDate.getMonth() + 1
        document.querySelector("#eventYear").value = editableEventDate.getFullYear()

        editEvent = true
        previousTimeOfEvent = editableEvent.time
        previousDateOfEvent = editableEvent.date
        showAddEventPopup()
    }
})