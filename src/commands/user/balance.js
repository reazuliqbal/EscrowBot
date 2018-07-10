import Discord from 'discord.js';
import steem from 'steem';
import { Command } from 'discord.js-commando';
import config from '../../config';

export default class BalanceCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'balance',
      group: 'user',
      memberName: 'balance',
      description: 'Shows the current balance of a user',
      examples: ['balance reazuliqbal'],
      throttling: {
        usages: 2,
        duration: 10,
      },
      args: [
        {
          key: 'user',
          label: 'STEEM USER',
          prompt: 'Please enter a valid STEEM username.',
          type: 'string',
          default: config.STEEM_ACCOUNT,
        },
      ],
      argsPromptLimit: 0,
    });
  }

  async run(message, { user }) {
    return steem.api.getAccountsAsync([user])
      .then(([result]) => {
        if (result === undefined) {
          message.reply('We could not find this user on STEEM Blockchain.');
        } else {
          const richEmbed = new Discord.RichEmbed()
            .setTitle('User Balance')
            .setColor(0x00AE86)
            .addField('Username', result.name, true)
            .addField('STEEM', result.balance, true)
            .addField('SBD', result.sbd_balance, true);

          message.channel.send(richEmbed);
        }
      })
      .catch(err => console.log(err));
  }
}
