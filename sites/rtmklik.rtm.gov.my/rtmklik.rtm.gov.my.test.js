const { parser, url } = require('./rtmklik.rtm.gov.my.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-09-04', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2',
  xmltv_id: 'TV2.my'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://rtm.glueapi.io/v3/epg/2/ChannelSchedule?dateStart=2022-09-04&dateEnd=2022-09-04&timezone=0'
  )
})

it('can parse response', () => {
  const content =
    '{"id":2,"channel":"TV2","channelId":"2","image":"/live_channel/tv2_Trans.png","idAuthor":9,"type":"TV","timezone":8,"dateCreated":"2022-07-08T01:22:33.233","dateModified":"2022-07-21T21:58:39.77","itemCount":30,"prev":"https://rtm-admin.glueapi.io/v3/epg/2/ChannelSchedule?dateStart=2022-09-03&dateEnd=2022-09-03","next":"https://rtm-admin.glueapi.io/v3/epg/2/ChannelSchedule?dateStart=2022-09-05&dateEnd=2022-09-05","schedule":[{"idEPGProgramSchedule":109303,"dateTimeStart":"2022-09-04T19:00:00","dateTimeEnd":"2022-09-04T20:00:00","scheduleProgramTitle":"Hope Of Life","scheduleProgramDescription":"Kisah kehidupan 3 pakar bedah yang berbeza status dan latar belakang, namun mereka komited dengan kerjaya mereka sebagai doktor. Lakonan : Johnson Low, Elvis Chin, Mayjune Tan, Kelvin Liew, Jacky Kam dan Katrina Ho.","scheduleEpisodeNumber":0,"scheduleSeries":0,"duration":3600,"idEPGProgram":3603,"programTitle":"Hope Of Life","description":"Kisah kehidupan 3 pakar bedah yang berbeza status dan latar belakang, namun mereka komited dengan kerjaya mereka sebagai doktor. Lakonan : Johnson Low, Elvis Chin, Mayjune Tan, Kelvin Liew, Jacky Kam dan Katrina Ho.","episodeNumber":0,"series":0,"repeat":"Never","dateModified":"2022-08-29T02:14:56.647","dateCreated":"0001-01-01T00:00:00"}]}'

  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-09-04T19:00:00.000Z',
      stop: '2022-09-04T20:00:00.000Z',
      title: 'Hope Of Life',
      description:
        'Kisah kehidupan 3 pakar bedah yang berbeza status dan latar belakang, namun mereka komited dengan kerjaya mereka sebagai doktor. Lakonan : Johnson Low, Elvis Chin, Mayjune Tan, Kelvin Liew, Jacky Kam dan Katrina Ho.'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: '{"id":2,"channel":"TV2","channelId":"2","schedule":[]}'
  })
  expect(result).toMatchObject([])
})
