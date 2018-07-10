import Discord from 'discord.js';
import { Command } from 'discord.js-commando';

export default class ServersCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'servers',
      group: 'admin',
      memberName: 'servers',
      description: 'Generate a list of servers which are using the bot.',
      examples: ['servers'],
      throttling: {
        usages: 2,
        duration: 10,
      },
      ownerOnly: true,
    });
  }

  async run(message) {
    const server = [];
    const owner = [];
    const ownerId = [];

    await message.client.guilds.forEach((guild) => {
      server.push(guild.name);
      owner.push(guild.owner.user.username);
      ownerId.push(guild.owner.id);
    });

    const richEmbed = new Discord.RichEmbed()
      .setTitle('List of Guilds')
      .setColor(0x00AE86)
      .addField('Server', server.join('\n'), true)
      .addField('Owner', owner.join('\n'), true)
      .addField('Owner ID', ownerId.join('\n'), true);

    return message.channel.send(richEmbed);
  }
}
