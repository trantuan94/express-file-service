const moment = require('moment');
const localeTime = {
  year: 'năm',
  month: 'tháng',
  day: 'ngày',
  hour: 'giờ',
  minute: 'phút',
  second: 'giây'
};

module.exports = {

  formatDate(date, formatStr = 'YYYY-MM-DD', format = 'YYYY-MM-DD') {
    return moment(date, format).format(formatStr)
  },

  formatDayMonthYear(input, length) {
    input = '0000' + input;
    return input.slice(length);
  },

  getLocalTimeByUTC(time, format = false) {
    let localTime = time ? moment.utc(time).toDate() : moment().toDate();
    return format ? moment(localTime).format('YYYY-MM-DD HH:mm:ss') : localTime
  },

  getStartOfDate(date, format = false) {
    date = date ? moment(date).startOf('day') : moment().startOf('day');
    return format ? date.format('YYYY-MM-DD HH:mm:ss') : date
  },

  getEndOftDate(date, format = false) {
    date = date ? moment(date).endOf('day') : moment().endOf('day');
    return format ? date.format('YYYY-MM-DD HH:mm:ss') : date
  },

  getDaysBetween(startDate, endDate, format = 'YYYY-MM-DD', formatStr = 'YYYY-MM-DD') {
    if (moment(startDate, format) === moment(endDate, format)) return [moment(startDate, format).format(formatStr)];

    let days = this.getCountBetween(startDate, endDate);
    let rs = [];
    for (let i = 0; i <= days; i ++) {
      rs.push(
        moment(startDate, format).add(i, "d").format(formatStr)
      )
    }
    return rs;
  },

  // day, month, year -> YYYY-MM-DD
  dmyToString(day, month, year) {
    let dayStr = day.toString();
    dayStr = this.formatDayMonthYear(dayStr, -2);
    let monthStr = month.toString();
    monthStr = this.formatDayMonthYear(monthStr, -2);
    return year + '-' + monthStr + '-' + dayStr;
  },

  // dateStr có dạng 'YYYY-MM-DD'
  isSunday(dateStr) {
    let isoWeekday = moment(dateStr).isoWeekday();
    return isoWeekday === 7; // http://momentjs.com/docs/#/get-set/iso-weekday/
  },

  /*
    holidays là 1 mảng date: 'YYYY-MM-DD' được lấy trong bảng config with ID = 'holidays'
    date: 'YYYY-MM-DD'
  */
  isHolidays(holidays, date) {
    return holidays.indexOf(date) > -1
  },

  getMinutesFromTime(time) {
    let splitTime = time.split(':');
    let hour = parseInt(splitTime[0]);
    let minute = parseInt(splitTime[1]);
    return hour * 60 + minute;
  },

  getCountBetween(startDateStr, endDateStr) {
    let oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    let startDate = new Date(startDateStr);
    let endDate = new Date(endDateStr);
    return Math.round(Math.abs((startDate.getTime() - endDate.getTime()) / (oneDay)));
  },

  getToday(formatStr) {
    let date = moment();
    return formatStr ? date.format(formatStr) : date
  },

  // Tính số giây từ sTime1 đến sTime2
  // sTime1, sTime2 là string
  timeBetween(sTime1, sTime2, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!sTime1 || !sTime2) return null;
    let t1 = moment(sTime1, format);
    let t2 = moment(sTime2, format);
    if (!t1.isValid() || !t2.isValid()) return null;
    return t2.diff(t1, 'seconds');
  },

  // sTime phải là string có dạng HH:mm:ss (mỗi phần bắt buộc phải có 2 chữ số, có dấu 2 chấm và phải nằm trong khoảng 00:00:00 ~ 23:59:59)
  validateTime_HHmmss(sTime) {
    if (!sTime || typeof sTime !== 'string') return false;
    return /^([0-1][0-9]|[0-2][0-3]):([0-5][0-9]):([0-5][0-9])$/g.test(sTime);
  },

  // type = 'milliseconds' or 'seconds'
  formatDurationString(timeDurations, type = 'milliseconds', lang = localeTime) {
    let seconds = (type === 'milliseconds') ? Math.round(timeDurations / 1000) : timeDurations;
    let years = Math.round(seconds / 31536000);
    seconds = seconds % 31536000;
    let months = Math.round(seconds / 2592000);
    seconds = seconds % 2592000;
    let days = Math.round(seconds / 86400);
    seconds = seconds % 86400;
    let hours = Math.round(seconds / 3600);
    seconds = seconds % 3600;
    let minutes = Math.round(seconds / 60);
    seconds = seconds % 60;
    let msg = '';
    if (years > 0) {
      msg += `${years} ${lang.year}`;
    }
    if (months > 0) {
      if (msg.length) msg += ' ';
      msg += `${months} ${lang.month}`;
    }
    if (days > 0) {
      if (msg.length) msg += ' ';
      msg += `${days} ${lang.day}`;
    }
    if (hours > 0) {
      if (msg.length) msg += ' ';
      msg += `${hours} ${lang.hour}`;
    }
    if (minutes > 0) {
      if (msg.length) msg += ' ';
      msg += `${minutes} ${lang.minute}`;
    }
    if (seconds > 0) {
      if (msg.length) msg += ' ';
      msg += `${seconds} ${lang.second}`;
    }
    if (msg.length === 0) msg = '0 giây';
    return msg;
  },

  buildTimeString(h, m, s, separator = ':') {
    let hh = h > 9 ? '' + h : '0' + h;
    let mm = m > 9 ? '' + m : '0' + m;
    let ss = s > 9 ? '' + s : '0' + s;
    return hh + separator + mm + separator + ss;
  }
};
