import Discord from 'discord.js';
import steem from 'steem';
import { Command } from 'discord.js-commando';
import { Transaction } from '../../models';

export default class StatusCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'status',
      group: 'exchange',
      memberName: 'status',
      description: 'Gets the current status of escrow transaction',
      examples: ['status 11919919'],
      throttling: {
        usages: 2,
        duration: 10,
      },
      args: [
        {
          key: 'escrowId',
          label: 'Escrow ID',
          prompt: 'Please enter your escrow ID.',
          type: 'integer',
          parse: escrowid => escrowid.trim(),
        },
        {
          key: 'sender',
          label: 'SENDER',
          prompt: 'Please enter sender of the escrow transaction.',
          type: 'string',
          default: '',
        },
      ],
      argsPromptLimit: 0,
    });
  }

  async run(message, { escrowId, sender }) {
    let from = '';

    if (sender.length > 0) {
      from = sender;
    } else {
      const transaction = await Transaction.findOne({ escrowId }).populate('seller', 'username');
      if (transaction) from = transaction.seller.username;
    }

    if (!from) return message.reply('We could not able to find the escrow. It may already be fulfilled or doesn\'t exists.');

    return steem.api.getEscrowAsync(from, escrowId)
      .then((result) => {
        if (result === null) {
          message.reply('We could not able to find the escrow. It may already be fulfilled or doesn\'t exists.');
        } else {
          const richEmbed = new Discord.RichEmbed()
            .setTitle('Transaction Status')
            .setColor(0x00AE86)
            .addField('Escrow ID', result.escrow_id, true)
            .addField('STEEM', result.steem_balance, true)
            .addField('SBD', result.sbd_balance, true)
            .addField('Seller', result.from, true)
            .addField('Buyer', result.to, true)
            .addBlankField(true)
            .addField('Deadline', result.ratification_deadline, true)
            .addField('Expiration', result.escrow_expiration, true)
            .addBlankField(true)
            .addField('Buyer Approved', (result.to_approved) ? 'Yes' : 'No', true)
            .addField('Agent Approved', (result.agent_approved) ? 'Yes' : 'No', true)
            .addField('Disputed', (result.disputed) ? 'Yes' : 'No', true);

          message.channel.send(richEmbed);
        }
      })
      .catch(err => console.log(err));
  }
}
