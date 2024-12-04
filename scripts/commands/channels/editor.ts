import { DATA_DIR } from '../../constants'
import { Storage, Collection, Dictionary, Logger } from '@freearhey/core'
import { ChannelsParser, XML, ApiChannel } from '../../core'
import { Channel } from 'epg-grabber'
import { transliterate } from 'transliteration'
import nodeCleanup from 'node-cleanup'
import { program } from 'commander'
import inquirer, { QuestionCollection } from 'inquirer'
import sj from '@freearhey/search-js'

program
  .argument('<filepath>', 'Path to *.channels.xml file to edit')
  .option('-c, --country <name>', 'Default country (ISO 3166 code)', 'US')
  .parse(process.argv)

const filepath = program.args[0]
const programOptions = program.opts()
const defaultCountry = programOptions.country.toLowerCase()
const newLabel = ' [new]'

let options = new Collection()

async function main() {
  const storage = new Storage()

  if (!(await storage.exists(filepath))) {
    throw new Error(`File "${filepath}" does not exists`)
  }

  const parser = new ChannelsParser({ storage })

  const parsedChannels = await parser.parse(filepath)
  options = parsedChannels.map((channel: Channel): { channel: Channel; delete: boolean } => {
    return {
      channel,
      delete: false
    }
  })

  const dataStorage = new Storage(DATA_DIR)
  const channelsContent = await dataStorage.json('channels.json')

  const channelsIndex = sj.createIndex(channelsContent)

  const buffer = new Dictionary()
  for (let option of options.all()) {
    const channel: Channel = option.channel
    if (channel.xmltv_id) {
      if (channel.xmltv_id !== '-') {
        buffer.set(`${channel.xmltv_id}/${channel.lang}`, true)
      }
      continue
    }
    const choices = getOptions(channelsIndex, channel)
    const question: QuestionCollection = {
      name: 'option',
      message: `Choose xmltv_id for "${channel.name}" (${channel.site_id}):`,
      type: 'list',
      choices,
      pageSize: 10
    }

    await inquirer.prompt(question).then(async selected => {
      switch (selected.option) {
        case 'Overwrite':
          const input = await getInput(channel)
          channel.xmltv_id = input.xmltv_id
          break
        case 'Skip':
          channel.xmltv_id = '-'
          break
        default:
          const [, xmltv_id] = selected.option
            .replace(/ \[.*\]/, '')
            .split('|')
            .map((i: string) => i.trim().replace(newLabel, ''))
          channel.xmltv_id = xmltv_id
          break
      }

      const found = buffer.has(`${channel.xmltv_id}/${channel.lang}`)
      if (found) {
        const question: QuestionCollection = {
          name: 'option',
          message: `"${channel.xmltv_id}" already on the list. Choose an option:`,
          type: 'list',
          choices: ['Skip', 'Add', 'Delete'],
          pageSize: 5
        }
        await inquirer.prompt(question).then(async selected => {
          switch (selected.option) {
            case 'Skip':
              channel.xmltv_id = '-'
              break
            case 'Delete':
              option.delete = true
              break
            default:
              break
          }
        })
      } else {
        if (channel.xmltv_id !== '-') {
          buffer.set(`${channel.xmltv_id}/${channel.lang}`, true)
        }
      }
    })
  }
}

main()

function save() {
  const logger = new Logger()
  const storage = new Storage()

  if (!storage.existsSync(filepath)) return

  const channels = options
    .filter((option: { channel: Channel; delete: boolean }) => !option.delete)
    .map((option: { channel: Channel; delete: boolean }) => option.channel)

  const xml = new XML(channels)

  storage.saveSync(filepath, xml.toString())

  logger.info(`\nFile '${filepath}' successfully saved`)
}

nodeCleanup(() => {
  save()
})

async function getInput(channel: Channel) {
  const name = channel.name.trim()
  const input = await inquirer.prompt([
    {
      name: 'xmltv_id',
      message: '  ID:',
      type: 'input',
      default: generateCode(name, defaultCountry)
    }
  ])

  return { name, xmltv_id: input['xmltv_id'] }
}

function getOptions(channelsIndex, channel: Channel) {
  const channelId = generateCode(channel.name, defaultCountry)
  const query = channel.name
    .replace(/\s(SD|TV|HD|SD\/HD|HDTV)$/i, '')
    .replace(/(\(|\)|,)/gi, '')
    .replace(/\-/gi, ' ')
    .replace(/\+/gi, '')
  const similar = channelsIndex.search(query).map(item => new ApiChannel(item))

  const variants = new Collection()
  variants.add(`${channel.name.trim()} | ${channelId}${newLabel}`)
  similar.forEach((_channel: ApiChannel) => {
    const altNames = _channel.altNames.notEmpty() ? ` (${_channel.altNames.join(',')})` : ''
    const closed = _channel.closed ? ` [closed:${_channel.closed}]` : ''
    const replacedBy = _channel.replacedBy ? `[replaced_by:${_channel.replacedBy}]` : ''

    variants.add(`${_channel.name}${altNames} | ${_channel.id}${closed}${replacedBy}`)
  })
  variants.add('Overwrite')
  variants.add('Skip')

  return variants.all()
}

function generateCode(name: string, country: string) {
  const channelId: string = transliterate(name)
    .replace(/\+/gi, 'Plus')
    .replace(/^&/gi, 'And')
    .replace(/[^a-z\d]+/gi, '')

  return `${channelId}.${country}`
}
