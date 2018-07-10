import steem from 'steem';
import Discord from 'discord.js';
import { Command } from 'discord.js-commando';
import { BitlyClient } from 'bitly';
import { User, Transaction } from '../../models';
import SC2 from '../../modules';
import config from '../../config';

const bitly = new BitlyClient(config.BITLY_TOKEN, {});

export default class ExchangeCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'exchange',
      group: 'exchange',
      memberName: 'exchange',
      description: 'Generate SteemConnect link for escrow transaction',
      examples: ['exchange 10 STEEM @reazuliqbal#1149'],
      throttling: {
        usages: 2,
        duration: 10,
      },
      guildOnly: true,
      args: [
        {
          key: 'amount',
          label: 'AMOUNT',
          prompt: 'Please enter the amount you want to exchange.',
          type: 'float',
          min: config.MIN_AMOUNT,
        },
        {
          key: 'currency',
          label: 'STEEM or SBD',
          prompt: 'Please enter a currency, can be SBD or STEEM.',
          type: 'string',
          parse: symbols => symbols.toUpperCase(),
        },
        {
          key: 'beneficiary',
          label: 'RECEIVER',
          prompt: 'Please mention the user who will receive the fund.',
          type: 'member',
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

  async run(message, { amount, currency, beneficiary }) {
    const chainProps = await steem.api.getDynamicGlobalPropertiesAsync();
    const chainTime = new Date(`${chainProps.time}Z`);
    const ratificationDeadline = new Date(chainTime.getTime() + (86400 * 1000 * 1));
    const escrowExpiration = new Date(chainTime.getTime() + (86400 * 1000 * 30));

    const escrowId = parseInt((Math.random() * (99999999 - 10000000)) + 10000000, 10);
    let sbdAmount = '0.000 SBD';
    let steemAmount = '0.000 STEEM';

    if (currency === 'SBD') {
      sbdAmount = `${parseFloat(amount).toFixed(3)} SBD`;
    } else {
      steemAmount = `${parseFloat(amount).toFixed(3)} STEEM`;
    }

    const jsonMeta = {
      app: message.client.user.username,
    };

    await User.findParties(message.author.id, beneficiary.user.id)
      .then(async (result) => {
        if (!result.seller || !result.buyer) {
          return message.reply('There was an error. We could not find at least one of you in our database.');
        }

        // Determining and formating fee based on configuration
        const fee = `${parseFloat(amount * config.ESCROW_FEE).toFixed(3)} ${currency}`;

        // Generating SteemConnect hot sign link for initiating escrow
        let signUrl = SC2.sign('escrow_transfer', {
          from: result.seller.username,
          to: result.buyer.username,
          agent: config.STEEM_ACCOUNT,
          escrow_id: escrowId,
          sbd_amount: sbdAmount,
          steem_amount: steemAmount,
          fee,
          ratification_deadline: ratificationDeadline.toISOString().slice(0, -5),
          escrow_expiration: escrowExpiration.toISOString().slice(0, -5),
          json_meta: JSON.stringify(jsonMeta),
        }, '');

        signUrl = await bitly.shorten(signUrl);

        // Generating SteemConnect hot sign link for approving escrow
        let approveUrl = SC2.sign('escrow_approve', {
          from: result.seller.username,
          to: result.buyer.username,
          agent: config.STEEM_ACCOUNT,
          who: result.buyer.username,
          escrow_id: escrowId,
          approve: 1,
        }, '');

        approveUrl = await bitly.shorten(approveUrl);

        // Saving to internal database
        Transaction.create({
          escrowId,
          seller: result.seller._id,
          buyer: result.buyer._id,
          amount: parseFloat(amount).toFixed(3),
          currency,
          serverId: message.guild.id,
          ratificationDeadline,
          escrowExpiration,
        });

        const RichEmbed = new Discord.RichEmbed()
          .setTitle('Escrow Transaction')
          .setColor(0xe74c3c)
          .addField('Escrow ID', escrowId)
          .addField('STEEM', steemAmount, true)
          .addField('SBD', sbdAmount, true)
          .addField('Fee', fee, true)
          .addField('Seller', result.seller.username, true)
          .addField('Buyer', result.buyer.username, true)
          .addBlankField(true)
          .addField('Deadline', ratificationDeadline, true)
          .addField('Expiration', escrowExpiration, true);

        // Sending DM to initiator
        message.author.send(
          `Please hot sign the transaction on SteemConnect ${signUrl.url}, then type **\`${config.COMMAND_PREFIX}status ${escrowId}\`**`,
          RichEmbed.setURL(signUrl.url),
        );

        // Sending DM to receiver
        return beneficiary.send(
          `Congratulations, You are the benificiary of an escrow transaction. Please type **\`${config.COMMAND_PREFIX}status ${escrowId}\`** to check and then click ${approveUrl.url} to approve using SteemConnect.`,
          RichEmbed.setURL(approveUrl.url),
        );
      })
      .catch(err => console.log(err));
  }
}
