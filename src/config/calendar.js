const {
  CALENDAR_PLAY_MORNING_START, CALENDAR_PLAY_MORNING_END,
  CALENDAR_PLAY_AFTERNOON_START, CALENDAR_PLAY_AFTERNOON_END,
  TIME_PLAYER_START, TIME_PLAYER_END
} = process.env;

module.exports = {
  timePlayerStart: TIME_PLAYER_START,
  timePlayerEnd: TIME_PLAYER_END,

  calendarPlay: {
    morning: {
      start: CALENDAR_PLAY_MORNING_START,
      end: CALENDAR_PLAY_MORNING_END
    },
    afternoon: {
      start: CALENDAR_PLAY_AFTERNOON_START,
      end: CALENDAR_PLAY_AFTERNOON_END
    }
  },
}
