"use strict"

const localStorage = window.localStorage
const currentPeriodElement = document.querySelector(".period__text")

let calendarScaleOpened = false
let calendarScale = localStorage.getItem("calendarScale")
let selectedDate = 0
let appJustLaunched = true
calendarScale = calendarScale || "3 дня"

document.querySelector(".scale__text").innerHTML = calendarScale
document.querySelector(".calendar").style.height = `${document.querySelector(".calendar").clientHeight}px`

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
            <button class="side-calendar__day" title="Перейти на ${i} ${formatMonth(sideCalendarDate)}">${i}</button>
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

    setTimeout(() => {
        daysElement.innerHTML = ""

        for (let i = 0; i <= differenceInDays; i++) {
            let weekDay = startDate.toLocaleString("ru-RU", { weekday: "short" })
            weekDay = weekDay[0].toUpperCase() + weekDay.slice(1)

            daysElement.insertAdjacentHTML("beforeend", `
            <div class="days__item ${(startDate.getDate() == selectedDate) ? "days__item_selected" : ""}">
                <div class="days__date">
                    <p class="days__week-day">${weekDay}</p>
                    <p class="days__month-day">${startDate.getDate()}</p>
                </div>
                <div class="days__events">

                </div>
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
        case "3 дня":
            periodEndDate.setTime(periodStartDate.getTime())
            periodEndDate.setDate(periodStartDate.getDate() + 2)
            break
        case "Неделя":
            console.log(periodStartDate.getDay())
            if (periodStartDate.getDay() !== 0) {
                periodStartDate.setDate(periodStartDate.getDate() - periodStartDate.getDay() + 1)
            } else {
                periodStartDate.setDate(periodStartDate.getDate() - 6)
            }
            periodEndDate.setTime(periodStartDate.getTime())
            periodEndDate.setDate(periodStartDate.getDate() + 6)
            break
        case "Месяц":
            periodStartDate.setDate(1)
            periodEndDate.setTime(periodStartDate.getTime())
            periodEndDate.setMonth(periodStartDate.getMonth() + 1)
            periodEndDate.setDate(0)
            break
        case "3 месяца":
            periodStartDate.setDate(1)
            periodEndDate.setTime(periodStartDate.getTime())
            periodEndDate.setMonth(periodStartDate.getMonth() + 3)
            periodEndDate.setDate(0)
            break
        case "Год":
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
        case "3 дня":
            periodStartDate.setDate(periodStartDate.getDate() + changeFactor * 2)
            periodEndDate.setDate(periodEndDate.getDate() + changeFactor * 2)
            break
        case "Неделя":
            periodStartDate.setDate(periodStartDate.getDate() + changeFactor * 7)
            periodEndDate.setDate(periodEndDate.getDate() + changeFactor * 7)
            break
        case "Месяц":
            periodStartDate.setMonth(periodStartDate.getMonth() + changeFactor * 1)
            periodEndDate.setTime(periodStartDate)
            periodEndDate.setMonth(periodStartDate.getMonth() + 1)
            periodEndDate.setDate(0)
            break
        case "3 месяца":
            periodStartDate.setMonth(periodStartDate.getMonth() + changeFactor * 3)
            periodEndDate.setTime(periodStartDate)
            periodEndDate.setMonth(periodEndDate.getMonth() + 3)
            periodEndDate.setDate(0)
            break
        case "Год":
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

document.addEventListener("click", (event) => {
    if (selectedDate != 0) {
        document.querySelector(".days__item_selected").classList.add("days__item_deselected")
        selectedDate = 0
    }
    if (calendarScaleOpened && !event.target.closest(".scale__current")) {
        calendarScaleOpened = false
        for (let i = 0; i < 5; i++) {
            if (event.target.closest(`.scale__option:nth-child(${i + 1})`)) {
                const scaleOptionElement = document.querySelector(`.scale__option:nth-child(${i + 1})`)
                document.querySelector(".scale__text").innerHTML = scaleOptionElement.innerHTML
                calendarScale = scaleOptionElement.innerHTML
                setCalendarScale()
                localStorage.setItem("calendarScale", calendarScale)
                break
            }
        }
        const scaleOptionsElement = document.querySelector(".scale__options-wrapper")
        scaleOptionsElement.classList.remove("scale__options-wrapper_open")
        scaleOptionsElement.classList.add("scale__options-wrapper_close")
        document.querySelector(".scale__toggle").src = "img/open.svg"
    } else if (event.target.closest(".scale")) {
        calendarScaleOpened = !calendarScaleOpened
        const scaleOptionsElement = document.querySelector(".scale__options-wrapper")
        if (calendarScaleOpened) {
            scaleOptionsElement.classList.remove("scale__options-wrapper_close")
            scaleOptionsElement.classList.add("scale__options-wrapper_open")
            document.querySelector(".scale__toggle").src = "img/close.svg"
        } else {
            scaleOptionsElement.classList.remove("scale__options-wrapper_open")
            scaleOptionsElement.classList.add("scale__options-wrapper_close")
            document.querySelector(".scale__toggle").src = "img/open.svg"
        }
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
        document.querySelector(".add-event-popup").classList.add("add-event-popup_open")
    } else if (event.target.closest("#closePopup") || event.target.closest(".add-event-popup__shade-area")) {
        document.querySelector(".add-event-popup").classList.remove("add-event-popup_open")
        document.querySelector(".add-event-popup").classList.add("add-event-popup_close")
        setTimeout(() => {
            document.querySelector(".add-event-popup").classList.remove("add-event-popup_close")
        }, 500)
    }
})