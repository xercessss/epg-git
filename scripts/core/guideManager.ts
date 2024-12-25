import { Collection, Logger, Storage, StringTemplate } from '@freearhey/core';
import { OptionValues } from 'commander';
import { Channel, Program } from 'epg-grabber';
import { Guide } from '.';

type GuideManagerProps = {
  options: OptionValues;
  logger: Logger;
  channels: Collection;
  programs: Collection;
}

export class GuideManager {
  options: OptionValues;
  storage: Storage;
  logger: Logger;
  channels: Collection;
  programs: Collection;

  constructor({ channels, programs, logger, options }: GuideManagerProps) {
    this.options = options;
    this.logger = logger;
    this.channels = channels;
    this.programs = programs;
    this.storage = new Storage();
  }

  async createGuides() {
    const pathTemplate = new StringTemplate(this.options.output);

    // Grouping channels by language and site with conditional prefixes
    const groupedChannels = this.channels
      .orderBy([(channel: Channel) => channel.xmltv_id])
      .uniqBy((channel: Channel) => `${channel.xmltv_id}:${channel.site}:${channel.lang}`)
      .map((channel: Channel) => {
        // Check if site is 'bein.com' and prepend "AR|" to the channel name
        if (channel.site === 'bein.com') {
          channel.name = `AR| ${channel.name}`;
        }

        // Check if site is 'osn.com' and modify the channel name accordingly
        if (channel.site === 'osn.com') {
          if (channel.name.includes("OSN")) {
            // Append "| " after "OSN"
            channel.name = channel.name.replace("OSN", "OSN| ");
          } else {
            // Prepend "OSN|"
            channel.name = `OSN| ${channel.name}`;
          }
          // Append " FHD" to the end of the channel name
          channel.name += " FHD"; 
        }

        // Check if site is 'sky.com' and prepend "UK| " to the channel name
        if (channel.site === 'sky.com') {
          channel.name = `UK| ${channel.name}`; // Prepend "UK| " to the existing channel name
        }

        return channel; // Return the modified channel
      })
      .groupBy((channel: Channel) => {
        return pathTemplate.format({ lang: channel.lang || 'en', site: channel.site || '' });
      });

    // Grouping programs by language and site
    const groupedPrograms = this.programs
      .orderBy([(program: Program) => program.channel, (program: Program) => program.start])
      .groupBy((program: Program) => {
        const lang =
          program.titles && program.titles.length && program.titles[0].lang
            ? program.titles[0].lang
            : 'en';

        return pathTemplate.format({ lang, site: program.site || '' });
      });

    // Creating guides for each group
    for (const groupKey of groupedPrograms.keys()) {
      const guide = new Guide({
        filepath: groupKey,
        gzip: this.options.gzip,
        channels: new Collection(groupedChannels.get(groupKey)),
        programs: new Collection(groupedPrograms.get(groupKey)),
        logger: this.logger,
      });

      await guide.save();
    }
  }
}

