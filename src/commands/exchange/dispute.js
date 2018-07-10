import steem from 'steem';
import Discord from 'discord.js';
import { Command } from 'discord.js-commando';
import { BitlyClient } from 'bitly';
import SC2 from '../../modules';
import config from '../../config';
import { Transaction, User } from '../../models';

const bitly = new BitlyClient(config.BITLY_TOKEN, {});

export default class DisputeCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'dispute',
      group: 'exchange',
      memberName: 'dispute',
      description: 'Generate SteemConnect link for disputing transaction.',
      examples: ['dispute 33899032'],
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
      ],
      argsPromptLimit: 0,
    });
  }

  hasPermission(message) {
    if (!message.member.roles.some(role => [config.USER_ROLE].includes(role.name))) {
      return 'Please register to use this command.';
    }
    return true;
  }

  async run(message, { escrowId }) {
    const trx = await Transaction.findOne({ escrowId }).populate('buyer seller', 'username');

    const user = await User.findOne({ discordId: message.author.id });

    if (!trx) {
      return message.reply('We could not find this transaction.');
    }

    if (![trx.buyer.username, trx.seller.username].includes(user.username)) {
      return message.say('You can not dispute this transaction.');
    }

    return steem.api.getEscrowAsync(trx.seller.username, escrowId)
      .then(async (result) => {
        if (result === null) {
          return message.reply('We could not find this transaction.');
        }

        if (result.disputed) return message.reply('This transaction has already been disputed.');

        // Generating SteemConnect hot sign link
        let signUrl = SC2.sign('escrow_dispute', {
          from: trx.seller.username,
          to: trx.buyer.username,
          agent: config.STEEM_ACCOUNT,
          who: user.username,
          escrow_id: escrowId,
        }, '');

        signUrl = await bitly.shorten(signUrl);

        await Transaction.updateTrx(trx._id, { disputed: true });

        const richEmbed = new Discord.RichEmbed()
          .setTitle('Transaction Status')
          .setColor(0x00AE86)
          .addField('Escrow ID', result.escrow_id, true)
          .addField('STEEM', result.steem_balance, true)
          .addField('SBD', result.sbd_balance, true)
          .addField('Sender', result.from, true)
          .addField('Receiver', result.to, true)
          .addBlankField(true)
          .addField('Deadline', result.ratification_deadline, true)
          .addField('Expiration', result.escrow_expiration, true)
          .addBlankField(true)
          .addField('Receiver Approved', (result.to_approved) ? 'Yes' : 'No', true)
          .addField('Agent Approved', (result.agent_approved) ? 'Yes' : 'No', true)
          .addField('Disputed', (result.disputed) ? 'Yes' : 'No', true);

        return message.channel.send(`To dispute please hot sign the transaction on SteemConnect ${signUrl.url}.`, richEmbed);
      })
      .catch(err => console.error(err));
  }
}
