document.getElementById("sizes").addEventListener('click', () => {
  alert(`header - ${document.querySelector('header').getClientRects()[0].height}, body - ${document.body.getClientRects()[0].height}, footer - ${document.querySelector('footer').getClientRects()[0].height}`);
})
/**
 * TODO: БАГИ:
 *       [] при клике по календарю попадая на границу дней выпадает ошибка в консоли.
 *
 * TODO: ФИЧИ:
 *       [] добавить возможность выгрузки данных.
 *       [] До клика по дню в календаре не отображать 'footer'
 *
 * TODO: НАПИСАТЬ ТЕСТЫ ? И тогда архитектура появиться ?
 */

/**
 * TODO: Регистрация служебного сценария (сервис работник для PWA)
 *       https://web.dev/offline-fallback-page/
 */
// window.addEventListener("load", () => {
//   if ("serviceWorker" in navigator) {
//     navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
//   }
// });

// TODO: Как будут организованны данные:

// Какие данные ?
//  * год
//  * месяц
//  * число
//  * meta информация за число
//  * задачи на число

// Как будет осуществляться доступ к данным ?
//  * data[2023][07][06]
//  * data[2023][07][06][meta]
//  * data[2023][07][06][data]

// Какая будет структура данных ?
// const data = {
//   2023: {
//     7: {
//       6: {
//         meta: {},
//         data: "",
//       },
//     },
//   },
// };

class DataStorage {
  constructor() {
    this._data = {};
    this._checkDataExists();
  }

  async _checkDataExists() {
    try {
      const value = await localforage.getItem("calendar-data");
      if (value === null) {
        await localforage.setItem("calendar-data", JSON.stringify({}));
        this._data = {};
        console.log("Впервые проинициализирован 'IndexedDB'");
      } else {
        this._data = JSON.parse(value);
        console.log("Данные загружены в приложение из 'IndexedDB'");
        console.log({ data: this._data });
      }
    } catch (err) {
      console.log("Ошибка при проверки данных в 'IndexedDB'", err);
    }
  }

  async getData(date) {
    if (!this._data?.[date]) {
      return null;
    }
    return this._data[date];
  }

  async saveData(date, dayData) {
    if (date.length !== 8) {
      new Error('При сохранении данных, дата не соответствует валидному формату в 8 символов');
    }

    if (this._data[date]) {
      this._data[date] = [...this._data[date], dayData];
    } else {
      this._data[date] = [dayData];
    }

    try {
      await localforage.setItem("calendar-data", JSON.stringify(this._data));
      console.log("Данные успешно сохранены");
      console.log({ data: this._data });
    } catch (error) {
      console.log("Ошибка при сохранении данных");
    }


    // if (!this._data?.[year]) {
    //   this._data[year] = {[year]: {}};
    // }
    // if (!this._data?.[year]?.[month]) {
    //   this._data[year][month] = {[month]: {}};
    // }
    // if (!this._data?.[year]?.[month]?.[day]) {
    //   this._data[year][month][day] = {[day]: {}};
    // }
    // if (!this._data?.[year]?.[month]?.[day]?.["data"]) {
    //   this._data[year][month][day]["data"] = [];
    // }

    // if (this._data?.[year]?.[month]?.[day]?.data) {
    //   previousDataInSelectedDay = this._data[year][month][day].data;
    // }

    // if (!this._data[year]) {
    //   this._data[year] = {[year]: {}};
    // }
    // if (!this._data[year][month]) {
    //   this._data[year][month] = {[month]: {}};
    // }
    // if (!this._data[year][month][day]) {
    //   this._data[year][month][day] = {[day]: {}};
    // }
    // if (!this._data[year][month][day]["data"]) {
    //   this._data[year][month][day]["data"] = [];
    // }

    // previousDataInSelectedDay = this._data[year][month][day].data;

    // this._data[year][month][day].data = [...previousDataInSelectedDay, dayData];
  }
}

const dataStorage = new DataStorage();

const monthsOfYear = {
  1: "Январь",
  2: "Февраль",
  3: "Март",
  4: "Апрель",
  5: "Май",
  6: "Июнь",
  7: "Июль",
  8: "Август",
  9: "Сентябрь",
  10: "Октябрь",
  11: "Ноябрь",
  12: "Декабрь",
};

class Calendar {
  constructor(calendarHTMLContainer) {
    this.calendarHTMLContainer = calendarHTMLContainer;

    this.PRESENT_DATE_DAY = new Date().getDate();
    this.PRESENT_DATE_MONTH_NUMBER = new Date().getMonth() + 1;
    this.PRESENT_DATE_MONTH_TEXT = monthsOfYear[this.PRESENT_DATE_MONTH_NUMBER];
    this.PRESENT_DATE_YEAR = new Date().getFullYear();

    this.renderedCalendarDayOfMonth = this.PRESENT_DATE_DAY;
    this.renderedCalendarMonthNumber = this.PRESENT_DATE_MONTH_NUMBER;
    this.renderedCalendarMonthText = this.PRESENT_DATE_MONTH_TEXT;
    this.renderedCalendarYear = this.PRESENT_DATE_YEAR;

    this.userSelectedDayInCalendarDayOfMonth = null;
    this.userSelectedDayInCalendarMonthNumber = null;
    this.userSelectedDayInCalendarMonthText = null;
    this.userSelectedDayInCalendarYear = null;

    this.userSelectedDayDomElement = null;

    this.markdownCalendarForRenderArray = [];

    this.render(this.PRESENT_DATE_YEAR, this.PRESENT_DATE_MONTH_NUMBER);
  }

  createDaysOfMonthToRender(year, month) {
    const daysOfMonthToRender = [];

    const MS = 1000;
    const S = 60;
    const M = 60;
    const H = 24;

    const firstDayOfDesiredMonth = new Date(
      Number(year),
      Number(month - 1),
      1
    ).getTime();

    const ordinalDayOfWeek = new Date(firstDayOfDesiredMonth).getDay();

    for (let day = 1 - ordinalDayOfWeek; day <= 42 - ordinalDayOfWeek; day++) {
      daysOfMonthToRender.push(
        new Date(firstDayOfDesiredMonth + day * MS * S * M * H).getDate()
      );
    }

    return daysOfMonthToRender;
  }

  createCalendarHTMLMarkupForRendering(daysOfMonth) {
    const calendarHTMLMarkupForRendering = [];

    let isPreviousMonthDays = false;
    let isNextMonthDays = false;

    if (daysOfMonth[0] > 20) {
      isPreviousMonthDays = true;
    }

    daysOfMonth.forEach((day, index) => {
      const prevMonthClass = "day-of-week--previous-month";
      const nextMonthClass = "day-of-week--next-month";

      if (isPreviousMonthDays && day === 1) {
        isPreviousMonthDays = false;
      }

      if (!isPreviousMonthDays && index > 20 && day === 1) {
        isNextMonthDays = true;
      }

      calendarHTMLMarkupForRendering.push(`
        <div class="day-of-week ${isPreviousMonthDays ? prevMonthClass : ""} ${
        isNextMonthDays ? nextMonthClass : ""
      }">
          <span class="day-of-week--day">${day
            .toString()
            .padStart(2, "0")}</span>
        </div>
      `);
    });

    return calendarHTMLMarkupForRendering.join("");
  }

  render(year, month) {
    this.calendarHTMLContainer.innerHTML =
      this.createCalendarHTMLMarkupForRendering(
        this.createDaysOfMonthToRender(year, month)
      );
  }

  getCurrentFullDate() {
    return `${this.PRESENT_DATE_DAY.toString().padStart(2, "0")} ${
      this.PRESENT_DATE_MONTH_TEXT
    } ${this.PRESENT_DATE_YEAR}`;
  }

  getUserSelectedFullDate() {
    return `${this.userSelectedDayInCalendarDayOfMonth
      .toString()
      .padStart("0", 2)} ${this.userSelectedDayInCalendarMonthText} ${
      this.userSelectedDayInCalendarYear
    }`;
  }

  nextMonth() {
    if (this.renderedCalendarMonthNumber === 12) {
      this.renderedCalendarMonthNumber = 1;
      this.renderedCalendarMonthText =
        monthsOfYear[this.renderedCalendarMonthNumber];
      this.renderedCalendarYear += 1;
      return;
    }

    this.renderedCalendarMonthNumber += 1;
    this.renderedCalendarMonthText =
      monthsOfYear[this.renderedCalendarMonthNumber];
  }

  prevMonth() {
    if (this.renderedCalendarMonthNumber === 1) {
      this.renderedCalendarMonthNumber = 12;
      this.renderedCalendarMonthText =
        monthsOfYear[this.renderedCalendarMonthNumber];
      this.renderedCalendarYear -= 1;
      return;
    }

    this.renderedCalendarMonthNumber -= 1;
    this.renderedCalendarMonthText =
      monthsOfYear[this.renderedCalendarMonthNumber];
  }

  set userSelectedDayInCalendarDomElement(userSelectedDayOfMonthDomElement) {
    this.userSelectedDayDomElement = userSelectedDayOfMonthDomElement;
    if (this.userSelectedDayDomElement) {
      this.userSelectedDayInCalendarDayOfMonth =
        this.userSelectedDayInCalendarDomElement.querySelector(
          ".day-of-week--day"
        ).innerText;

      // TODO: Если пользователь в отрендеренном календаре
      //       выбрал день предыдущего месяца
      if (
        this.userSelectedDayDomElement.classList.contains(
          "day-of-week--previous-month"
        )
      ) {
        if (this.renderedCalendarMonthNumber === 1) {
          this.userSelectedDayInCalendarMonthNumber = 12;
          this.userSelectedDayInCalendarMonthText = "Декабрь";
          this.userSelectedDayInCalendarYear = this.renderedCalendarYear - 1;
          return;
        } else {
          this.userSelectedDayInCalendarMonthNumber =
            this.renderedCalendarMonthNumber - 1;
          this.userSelectedDayInCalendarMonthText =
            monthsOfYear[this.userSelectedDayInCalendarMonthNumber];
          this.userSelectedDayInCalendarYear = this.renderedCalendarYear;
          return;
        }
      }
      // TODO: Если пользователь в отрендеренном календаре
      //       выбрал день следующего месяца
      if (
        this.userSelectedDayDomElement.classList.contains(
          "day-of-week--next-month"
        )
      ) {
        if (this.renderedCalendarMonthNumber === 12) {
          this.userSelectedDayInCalendarMonthNumber = 1;
          this.userSelectedDayInCalendarMonthText = "Январь";
          this.userSelectedDayInCalendarYear = this.renderedCalendarYear + 1;
          return;
        } else {
          this.userSelectedDayInCalendarMonthNumber =
            this.renderedCalendarMonthNumber + 1;
          this.userSelectedDayInCalendarMonthText =
            monthsOfYear[this.userSelectedDayInCalendarMonthNumber];
          this.userSelectedDayInCalendarYear = this.renderedCalendarYear;
          return;
        }
      }
      // TODO: Если пользователь в отрендеренном календаре
      //       выбрал день месяца не следующего месяца и не предыдущего, а отрендеренного
      this.userSelectedDayInCalendarYear = this.renderedCalendarYear;
      this.userSelectedDayInCalendarMonthNumber =
        this.renderedCalendarMonthNumber;
      this.userSelectedDayInCalendarMonthText = this.renderedCalendarMonthText;
    }
  }

  get userSelectedDayInCalendarDomElement() {
    return this.userSelectedDayDomElement;
  }
}

const calendarHTMLContainer = document.querySelector(".days-of-month-wrapper");
const calendar = new Calendar(calendarHTMLContainer);

/**
 * TODO: При загрузке страници - отобразить в футуре текущую дату.
 */

window.addEventListener("load", handlerPageLoad);

function handlerPageLoad() {
  const wrapperWithFullDateDisplayedInFooter = document.querySelector(
    ".show-selected-day-in-footer-wrapper"
  );
  wrapperWithFullDateDisplayedInFooter.innerText =
    calendar.getCurrentFullDate();
}

/**
 * TODO: При загрузке страницы отобразить в "title" сегодняшний месяц и год.
 */

window.addEventListener("load", handlerPageLoad2);

function handlerPageLoad2() {
  document.querySelector(".month-title__month").innerText =
    calendar.PRESENT_DATE_MONTH_TEXT.toUpperCase();
  document.querySelector(".month-title__year").innerText =
    calendar.PRESENT_DATE_YEAR;
}

/**
 * TODO: При нажатии на день месяца в календаре:
 *         1. Выделить его в календаре как текущий просматриваемый день.
 *         2. Если повторно кликнуть на уже выбранный день, то снять с него выделение.
 */

const daysOfMonthWrapper = document.querySelector(".days-of-month-wrapper");
daysOfMonthWrapper.addEventListener("click", handlerClickDayOfMonth);

function handlerClickDayOfMonth(event) {
  event.preventDefault();
  let newSelectedDayOfMonthDOMElement = null;

  if (event.target.classList.contains("day-of-week")) {
    newSelectedDayOfMonthDOMElement = event.target;
  }

  if (event.target.parentNode.classList.contains("day-of-week")) {
    newSelectedDayOfMonthDOMElement = event.target.parentNode;
  }

  if (calendar.userSelectedDayInCalendarDomElement === null) {
    newSelectedDayOfMonthDOMElement.classList.add("day-of-week--selected-day");
    calendar.userSelectedDayInCalendarDomElement =
      newSelectedDayOfMonthDOMElement;
    return;
  }

  if (
    calendar.userSelectedDayInCalendarDomElement ===
    newSelectedDayOfMonthDOMElement
  ) {
    calendar.userSelectedDayInCalendarDomElement.classList.remove(
      "day-of-week--selected-day"
    );
    calendar.userSelectedDayInCalendarDomElement = null;
    return;
  }

  if (
    calendar.userSelectedDayInCalendarDomElement !== null &&
    calendar.userSelectedDayInCalendarDomElement !==
      newSelectedDayOfMonthDOMElement
  ) {
    calendar.userSelectedDayInCalendarDomElement.classList.remove(
      "day-of-week--selected-day"
    );
    newSelectedDayOfMonthDOMElement.classList.add("day-of-week--selected-day");
    calendar.userSelectedDayInCalendarDomElement =
      newSelectedDayOfMonthDOMElement;
    return;
  }
}

/**
 * TODO: При нажатии на день месяца отобразить в футуре выбранную дату.
 */

daysOfMonthWrapper.addEventListener(
  "click",
  handlerClickDayOfMontAndLoadDateToFooter
);

function handlerClickDayOfMontAndLoadDateToFooter(event) {
  event.preventDefault();
  const wrapperWithFullDateDisplayedInFooter = document.querySelector(
    ".show-selected-day-in-footer-wrapper"
  );

  wrapperWithFullDateDisplayedInFooter.innerText =
    calendar.getUserSelectedFullDate();
}

/**
 * TODO: При нажатии в футуре на кнопку добавить задачу - показать "overlay".
 */

const addTaskButton = document.querySelector(".add-task-button");

addTaskButton.addEventListener("click", handlerClickAddTaskButton);

function handlerClickAddTaskButton() {
  toggleShowOverlay();

  // TODO: Старт работы с данными. Конец с 'overlay'.

  const saveDataButton = document.querySelector(".save-task-button");
  const inputFieldData = document.querySelector(".input-field");

  let newDataForSave = "";

  inputFieldData.addEventListener("input", (event) => {
    event.preventDefault();
    newDataForSave = event.target.value.trim();
  });

  saveDataButton.addEventListener("click", handlerClickSaveTaskButton);

  function handlerClickSaveTaskButton() {
    if (newDataForSave === "") return;

    const userSelectedDate = {
      year: String(calendar.userSelectedDayInCalendarYear).padStart(2, '0'),
      month: String(calendar.userSelectedDayInCalendarMonthNumber).padStart(2, '0'),
      day: String(calendar.userSelectedDayInCalendarDayOfMonth).padStart(2, '0'),
    };

    dataStorage.saveData(`${userSelectedDate.year}${userSelectedDate.month}${userSelectedDate.day}`, newDataForSave);
  }
}

/**
 * TODO: При нажатии на кнопку закрытия поля ввода новой задачи - закрыть.
 */

function toggleShowOverlay() {
  let closeOverlayButton = null;

  const overlay = document.querySelector(".overlay");
  overlay.classList.toggle("overlay--show");

  if (closeOverlayButton === null) {
    closeOverlayButton = document.querySelector(".close-overlay-button");
    closeOverlayButton.addEventListener(
      "click",
      handlerClickCloseOverlayButton
    );
  }

  function handlerClickCloseOverlayButton() {
    closeOverlayButton.removeEventListener(
      "click",
      handlerClickCloseOverlayButton
    );
    overlay.classList.toggle("overlay--show");
  }
}

/**
 * TODO: При нажатии на кнопку следующего месяца:
 *         1. Изменить данные выбранного пользователем месяца в классе календаря.
 *         2. Изменить отображаемый месяц в заголовке на странице.
 */

const nextMonthButton = document.querySelector(".next-month-button");
nextMonthButton.addEventListener("click", handlerClickNextMonthButton);

function handlerClickNextMonthButton() {
  calendar.nextMonth();

  const monthTitle = document.querySelector(".month-title__month");
  monthTitle.innerText = calendar.renderedCalendarMonthText.toUpperCase();

  const yearTitle = document.querySelector(".month-title__year");
  yearTitle.innerText = calendar.renderedCalendarYear;

  calendar.render(
    calendar.renderedCalendarYear,
    calendar.renderedCalendarMonthNumber
  );
}

const prevMonthButton = document.querySelector(".prev-month-button");
prevMonthButton.addEventListener("click", handlerClickPrevMonthButton);

function handlerClickPrevMonthButton() {
  calendar.prevMonth();

  const monthTitle = document.querySelector(".month-title__month");
  monthTitle.innerText = calendar.renderedCalendarMonthText.toUpperCase();

  const yearTitle = document.querySelector(".month-title__year");
  yearTitle.innerText = calendar.renderedCalendarYear;

  calendar.render(
    calendar.renderedCalendarYear,
    calendar.renderedCalendarMonthNumber
  );
}

/**
 * TODO: РАБОТА С ДАННЫМИ.
 */

// document.addEventListener("DOMContentLoaded", (e) => {
// Проверка работы БД в браузере
// window.indexedDB =
// window.indexedDB ||
// window.mozIndexedDB ||
// window.webkitIndexedDB ||
// window.msIndexedDB;

// Открытие БД
// let openRequest = window.indexedDB.open("Calendar", 1);

// onupgradeneeded событие - происходит когда создаётся новая БД или происходит обновление существующей.
// openRequest.onupgradeneeded = (event) => {
// let DB = event.target.result;
// Проверка существующего объекта в БД
// if (!DB.)
// };
// });

// const data = {
//   2023: {
//     7: {
//       6: {
//         meta: {},
//         data: "",
//       },
//     },
//   },
// };

// class DataStorage {
//   constructor() {
//     this.data = {};
//     this.checkDataExists();
//   }

//   async checkDataExists() {
//     try {
//       const value = await localforage.getItem("calendar-data");
//       if (value === null) {
//         await localforage.setItem("calendar-data", JSON.stringify({}));
//         this.data = {};
//         console.log("Данные созданы впервые");
//       } else {
//         this.data = JSON.parse(value);
//         console.log("Данные загружены");
//       }
//     } catch (err) {
//       console.log("Ошибка при проверки данных", err);
//     }
//   }
// }

// const dataStorage = new DataStorage();

// localforage
//   .setItem("calendar-data", JSON.stringify(data))
//   .then(function (value) {
//     // Делайте другие вещи после сохранения значения
//     console.log(value);
//   })
//   .catch(function (err) {
//     // Этот код запускается, если были какие-либо ошибки
//     console.log(err);
//   });

// localforage
//   .getItem("calendar-data")
//   .then(function (value) {
//     // Этот код запускается после загрузки значения
//     // из офлайн-хранилища.
//     console.log(value);
//   })
//   .catch(function (err) {
//     // Этот код запускается, если были какие-либо ошибки
//     console.log(err);
//   });
/*
TODO: Как будут организованны данные:

Какие данные ?
 * год
 * месяц
 * число
 * meta информация за число
 * задачи на число

Как будет осуществляться доступ к данным ?
 * data[2023][07][06]
 * data[2023][07][06][meta]
 * data[2023][07][06][data]

Какая будет структура данных ?
const data = {
  2023: {
    7: {
      6: {
        meta: {},
        data: "",
      },
    },
  },
};

*/

/**
 * TODO: При загрузке страницы - отрендерить весь текущий месяц.
 */

// window.addEventListener("load", handlerPageLoadMonthRender);

// function handlerPageLoadMonthRender() {
//   // TODO: Неделя.
//   //       Всего их шесть (6).
//   //       Ниже пример июня из шести недель.

//   // 29, 30, 31, 01, 02, 03, 04
//   // 05, 06, 07, 08, 09, 10, 11
//   // 12, 13, 14, 15, 16, 17, 18
//   // 19, 20, 21, 22, 23, 24, 25
//   // 26, 27, 28, 29, 30, 01, 02
//   // 03, 04, 05, 06, 07, 08, 09

//   // const daysOfMonth = [
//   //   29, 30, 31,  1,  2,  3,  4,
//   //    5,  6,  7,  8,  9, 10, 11,
//   //   12, 13, 14, 15, 16, 17, 18,
//   //   19, 20, 21, 22, 23, 24, 25,
//   //   26, 27, 28, 29, 30,  1,  2,
//   //    3,  4,  5,  6,  7,  8,  9,
//   // ];

//   // TODO: Рендерить будем по месяцам.
//   //       При запуске всегда будет отображаться текущий месяц.

//   // TODO: Всегда в календаре будет отображено 42 дня (6*7).

//   // TODO: Нужен цикл из 42 дней.

//   for (let day = 1; day <= 42; day++) {
//     // console.log(day);
//   }

//   // TODO: Нужен массив с числами дней. Всего 42 дня в массиве.

//   // TODO: Нужно получить первый день месяца:

//   const firstDayOfMonth = new Date(2023, 6, 1).getTime();

//   // TODO: Нужно получить порядковый день недели:
//   // TODO: Вс - 0, Пн - 1, Вт - 2, Ср - 3, Чт - 4, Пт - 5, Сб - 6

//   const ordinalDayOfWeek = new Date(firstDayOfMonth).getDay(); // 6

//   // TODO: Рабочая формула для получения первого дня недели.
//   //       А дальше через 42 итерации заполнится массив на месяц
//   //       42 днями

//   // TODO: Получаю число первого дня, первой недели календаря из 6 недель.
//   //       new Date(firstDayOfMonth - 5 * 1000 * 60 * 60 * 24).getDate()  // 26

//   // TODO: Расшифровка:
//   //       * 5 = 1 - ordinalDayOfWeek. 1 - переменная let в цикле for
//   //       * 1000 - миллисекунды
//   //       * 60 - секунды
//   //       * 60 - минуты
//   //       * 24 - часы

//   const MS = 1000;
//   const S = 60;
//   const M = 60;
//   const H = 24;

//   // TODO: Итоговый массив с 42 днями месяца:

//   let daysOfMonth = [];

//   for (let day = 1 - ordinalDayOfWeek; day <= 42 - ordinalDayOfWeek; day++) {
//     daysOfMonth.push(
//       new Date(firstDayOfMonth + day * MS * S * M * H).getDate()
//     );
//   }

//   let isPreviousMonthDays = false;
//   let isNextMonthDays = false;

//   if (daysOfMonth[0] !== 1) {
//     isPreviousMonthDays = true;
//   }

//   const markdownResult = [];

//   daysOfMonth.forEach((day, index, array) => {
//     const prevMonthClass = "day-of-week--previous-month";
//     const nextMonthClass = "day-of-week--next-month";

//     if (day === 1) {
//       isPreviousMonthDays = false;
//       isNextMonthDays = true;
//     }

//     markdownResult.push(`
//       <div class="day-of-week ${isPreviousMonthDays ? prevMonthClass : ""} ${
//       isNextMonthDays ? nextMonthClass : ""
//     }">
//         <span class="day-of-week--day">${day.toString().padStart(2, "0")}</span>
//       </div>
//     `);
//   });

//   // document.querySelector(".days-of-month-wrapper").innerHTML =
//   //   markdownResult.join("");
//   // calendar.render();
// }
