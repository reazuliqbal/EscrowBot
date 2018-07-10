import { Command } from 'discord.js-commando';

export default class SetCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'set',
      group: 'admin',
      memberName: 'set',
      description: 'Sets settings.',
      examples: ['set price'],
      throttling: {
        usages: 2,
        duration: 10,
      },
      guildOnly: true,
      ownerOnly: true,
      args: [
        {
          key: 'key',
          label: 'KEY',
          prompt: 'A key is required.',
          type: 'string',
          validate: key => ['price'].includes(key),
        },
        {
          key: 'val',
          label: 'VALUE',
          prompt: 'A value is required.',
          type: 'string',
        },
      ],
    });
  }

  async run(message, { key, val }) {
    let { guild } = message;
    let value = val;
    let success = '';

    if (key === 'price') {
      guild = 'global';
      value = parseFloat(val).toFixed(2);
      success = `Price per USD has been set to ${value} BDT.`;
    }

    message.client.provider.set(guild, key, value)
      .then(() => {
        message.say(success);
      })
      .catch(e => console.log(e));
  }
}
