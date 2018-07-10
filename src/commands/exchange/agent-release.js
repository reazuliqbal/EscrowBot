import steem from 'steem';
import { Command } from 'discord.js-commando';
import { User, Transaction } from '../../models';
import config from '../../config';

export default class AgentReleaseCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'agent-release',
      group: 'exchange',
      memberName: 'agent-release',
      description: 'Release escrowed fund to specific user after dispute.',
      examples: ['agent-release 33899032 @reazuliqbal#1149'],
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
          key: 'beneficiary',
          label: 'RECEIVER',
          prompt: 'Please mention the user you are releasing funds to.',
          type: 'member',
        },
      ],
      argsPromptLimit: 0,
    });
  }

  hasPermission(message) {
    if (!message.member.roles.some(role => [config.HANDLER_ROLE].includes(role.name))) {
      return 'you do not have required permission to use this command!';
    }
    return true;
  }

  async run(message, { escrowId, beneficiary }) {
    const trx = await Transaction.findOne({ escrowId }).populate('buyer seller', 'username');

    const releaseTo = await User.findOne({ discordId: beneficiary.user.id });

    if (!trx) {
      return message.reply('We could not find this transaction.');
    }

    if (trx.serverId !== message.guild.id) {
      return message.reply('You can not release transaction initiated from another server.');
    }

    if (![trx.buyer.username, trx.seller.username].includes(releaseTo.username)) {
      return message.say('You can not release to this user.');
    }

    return steem.api.getEscrowAsync(trx.seller.username, escrowId)
      .then(async (result) => {
        if (result === null) {
          return message.reply('We could not find this transaction.');
        }

        if (!result.disputed) {
          return message.reply('This transaction was not disputed, hence can not be released.');
        }

        return steem.broadcast.escrowReleaseAsync(
          config.ACTIVE_KEY,
          result.from,
          result.to,
          config.STEEM_ACCOUNT,
          config.STEEM_ACCOUNT,
          releaseTo.username,
          parseInt(escrowId, 10),
          result.sbd_balance,
          result.steem_balance,
        )
          .then(async () => {
            await Transaction.updateTrx(trx._id, { completed: true });

            message.channel.send(`Escrowed funds has been release to ${beneficiary} (${releaseTo.username})`);
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
  }
}
