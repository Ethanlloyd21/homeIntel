export const trafficDays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

/** A future occurrence avoids presenting live incidents as typical weekly traffic.
 * TomTom interprets an offset-free departure in the route origin's local zone.
 */
export const trafficDeparture = (
  day: number,
  time: string,
  timeZone: string,
  now = new Date(),
) => {
  if (
    !Number.isInteger(day) ||
    day < 0 ||
    day > 6 ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  ) {
    throw new Error('Choose a valid day and time.')
  }
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (name: string) =>
    Number(parts.find((item) => item.type === name)?.value)
  const date = new Date(Date.UTC(part('year'), part('month') - 1, part('day')))
  date.setUTCDate(date.getUTCDate() + 7 + ((day - date.getUTCDay() + 7) % 7))
  return `${date.toISOString().slice(0, 10)}T${time}:00`
}

/** Convert the selected city's local wall time to the UTC instant used by map exports. */
export const typicalTrafficInstant = (
  day: number,
  time: string,
  timeZone: string,
  now = new Date(),
) => {
  const local = trafficDeparture(day, time, timeZone, now)
  const target = Date.parse(`${local}Z`)
  let instant = target
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  for (let i = 0; i < 3; i++) {
    const parts = formatter.formatToParts(new Date(instant))
    const p = (key: string) => Number(parts.find((v) => v.type === key)!.value)
    const rendered = Date.UTC(
      p('year'),
      p('month') - 1,
      p('day'),
      p('hour'),
      p('minute'),
      p('second'),
    )
    if (rendered === target) return instant
    instant += target - rendered
  }
  throw new Error(
    'This local time does not occur because of a clock change. Choose another time.',
  )
}
