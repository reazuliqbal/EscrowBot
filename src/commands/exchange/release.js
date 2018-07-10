import steem from 'steem';
import { Command } from 'discord.js-commando';
import { BitlyClient } from 'bitly';
import { User, Transaction } from '../../models';
import SC2 from '../../modules';
import config from '../../config';

const bitly = new BitlyClient(config.BITLY_TOKEN, {});

export default class ReleaseCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'release',
      group: 'exchange',
      memberName: 'release',
      description: 'Generate SteemConnect link for releasing escrow.',
      examples: ['release 33899032'],
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
      return message.say('You can not release this transaction.');
    }

    return steem.api.getEscrowAsync(trx.seller.username, escrowId)
      .then(async (result) => {
        if (result === null) {
          return message.reply('We could not find this transaction.');
        }

        let releaseTo = '';

        if (user.username === result.from) {
          releaseTo = result.to;
        } else {
          releaseTo = result.from;
        }

        await Transaction.updateTrx(trx._id, { completed: true });

        // Generating SteemConnect hot sign link
        let signUrl = SC2.sign('escrow_release', {
          from: result.from,
          to: result.to,
          agent: config.STEEM_ACCOUNT,
          who: user.username,
          receiver: releaseTo,
          escrow_id: escrowId,
          sbd_amount: result.sbd_balance,
          steem_amount: result.steem_balance,
        }, '');

        signUrl = await bitly.shorten(signUrl);

        return message.channel.send(`You are about to release escrowed balance for transaction ID: **${escrowId}**. Please click this ${signUrl.url} to release the fund to **${releaseTo}**`);
      })
      .catch(err => console.error(err));
  }
}
