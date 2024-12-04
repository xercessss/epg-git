const { DateTime } = require('luxon')

module.exports = {
  site: 'turksatkablo.com.tr',
  days: 2,
  url: function ({ date }) {
    return `https://www.turksatkablo.com.tr/userUpload/EPG/y.json?_=${date.valueOf()}`
  },
  request: {
    timeout: 60000,
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      let start = parseStart(item, date)
      if (prev && start < prev.start) {
        start = start.plus({ days: 1 })
        date = date.add(1, 'd')
      }
      let stop = parseStop(item, date)
      if (prev && stop < start) {
        stop = stop.plus({ days: 1 })
        date = date.add(1, 'd')
      }
      programs.push({
        title: item.b,
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const data = await axios
      .get('https://www.turksatkablo.com.tr/userUpload/EPG/y.json')
      .then(r => r.data)
      .catch(console.log)

    let channels = []

    data.k.forEach(item => {
      channels.push({
        lang: 'tr',
        site_id: item.x,
        name: item.n
      })
    })

    return channels
  }
}

function parseStart(item, date) {
  const time = `${date.format('YYYY-MM-DD')} ${item.c}`

  return DateTime.fromFormat(time, 'yyyy-MM-dd HH:mm', { zone: 'Europe/Istanbul' }).toUTC()
}

function parseStop(item, date) {
  const time = `${date.format('YYYY-MM-DD')} ${item.d}`

  return DateTime.fromFormat(time, 'yyyy-MM-dd HH:mm', { zone: 'Europe/Istanbul' }).toUTC()
}

function parseItems(content, channel) {
  let parsed
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    return []
  }
  if (!parsed || !parsed.k) return []
  const data = parsed.k.find(c => c.x == channel.site_id)

  return data ? data.p : []
}
