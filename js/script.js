"use strict"

const localStorage = window.localStorage
const currentPeriodElement = document.querySelector(".period__text")

let calendarScaleOpened = false
let calendarScale = localStorage.getItem("calendarScale")
calendarScale = calendarScale || "3 дня"
document.querySelector(".scale__text").innerHTML = calendarScale

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
const periodEndDate = new Date(periodStartDate.getTime())

const setCalendarScale = () => {
    switch (calendarScale) {
        case "3 дня":
            periodEndDate.setTime(periodStartDate.getTime())
            periodEndDate.setDate(periodStartDate.getDate() + 2)
            break
        case "Неделя":
            periodStartDate.setDate(periodStartDate.getDate() - periodStartDate.getDay() + 1)
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
    console.log(periodStartDate)
    console.log(periodEndDate)

    currentPeriodElement.innerHTML =
        `${periodStartDate.getDate()} ${formatMonth(periodStartDate)} - ${periodEndDate.getDate()} ${formatMonth(periodEndDate)}`
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
            periodEndDate.setMonth(periodStartDate.getMonth() + 1)
            periodEndDate.setDate(0)

            if (getDifferenceInMonths() >= 1) periodEndDate.setDate(0)
            break
        case "3 месяца":
            periodStartDate.setMonth(periodStartDate.getMonth() + changeFactor * 3)
            if (changeFactor === -1) {
                periodEndDate.setMonth(periodEndDate.getMonth() + changeFactor * 2)
            } else {
                periodEndDate.setMonth(periodEndDate.getMonth() + changeFactor * 4)
            }
            periodEndDate.setDate(0)

            if (getDifferenceInMonths() >= 3) periodEndDate.setDate(0)
            break
        case "Год":
            periodStartDate.setFullYear(periodStartDate.getFullYear() + changeFactor * 1)
            periodEndDate.setFullYear(periodEndDate.getFullYear() + changeFactor * 1)
            break
    }
    currentPeriodElement.innerHTML = `${periodStartDate.getDate()} ${formatMonth(periodStartDate)} - ${periodEndDate.getDate()} ${formatMonth(periodEndDate)}`
}

const getDifferenceInMonths = () => {
    let months = (periodEndDate.getFullYear() - periodStartDate.getFullYear()) * 12
    months -= periodStartDate.getMonth()
    months += periodEndDate.getMonth()
    return months
}

document.addEventListener("click", (event) => {
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
        periodStartDate.setTime(new Date().getTime())
        setCalendarScale()
    }
})