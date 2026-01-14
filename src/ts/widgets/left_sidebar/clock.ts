export class ClockWidget {
  private timeInterval: number | null = null;
  private calendarInterval: number | null = null;
  private timeElement: HTMLElement | null = null;
  private headerElement: HTMLElement | null = null;
  private daysElement: HTMLElement | null = null;

  constructor() {
    this.timeElement = document.getElementById("clock-time");
    this.headerElement = document.getElementById("calendar-header");
    this.daysElement = document.getElementById("calendar-days");

    this.init();
  }

  private init(): void {
    this.updateJakartaClock();
    this.generateCalendar();

    this.timeInterval = window.setInterval(
      () => this.updateJakartaClock(),
      1000,
    );

    this.calendarInterval = window.setInterval(() => {
      const now = new Date();
      if (
        now.getHours() === 0 &&
        now.getMinutes() === 0 &&
        now.getSeconds() === 0
      ) {
        this.generateCalendar();
      }
    }, 1000);
  }

  private updateJakartaClock(): void {
    if (!this.timeElement) {
      this.timeElement = document.getElementById("clock-time");
      if (!this.timeElement) return;
    }

    const now = new Date();
    const jakartaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );

    const hours = String(jakartaTime.getHours()).padStart(2, "0");
    const minutes = String(jakartaTime.getMinutes()).padStart(2, "0");
    const seconds = String(jakartaTime.getSeconds()).padStart(2, "0");

    const period = jakartaTime.getHours() >= 12 ? "PM" : "AM";
    const timeString = `${hours}:${minutes}:${seconds} ${period}`;

    this.timeElement.textContent = timeString;
  }

  private generateCalendar(): void {
    if (!this.headerElement || !this.daysElement) {
      this.headerElement = document.getElementById("calendar-header");
      this.daysElement = document.getElementById("calendar-days");
      if (!this.headerElement || !this.daysElement) return;
    }

    const now = new Date();
    const jakartaDate = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );

    const year = jakartaDate.getFullYear();
    const month = jakartaDate.getMonth();
    const today = jakartaDate.getDate();

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    this.headerElement.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    this.daysElement.innerHTML = "";

    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement("div");
      emptyDay.className = "calendar-day empty";
      this.daysElement.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day";
      dayElement.textContent = day.toString();

      if (day === today) {
        dayElement.classList.add("today");
      }

      this.daysElement.appendChild(dayElement);
    }
  }

  public destroy(): void {
    if (this.timeInterval) clearInterval(this.timeInterval);
    if (this.calendarInterval) clearInterval(this.calendarInterval);
  }
}

export const clockWidget = new ClockWidget();
