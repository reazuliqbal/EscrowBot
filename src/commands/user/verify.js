import steem from 'steem';
import { Command } from 'discord.js-commando';
import { User } from '../../models';
import config from '../../config';

export default class VerifyCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'verify',
      group: 'user',
      memberName: 'verify',
      description: 'Verify user registration.',
      examples: ['verify reazuliqbal'],
      throttling: {
        usages: 2,
        duration: 10,
      },
      guildOnly: true,
      args: [
        {
          key: 'username',
          label: 'STEEM USERNAME',
          prompt: 'Please enter your STEEM username.',
          type: 'string',
        },
      ],
      argsPromptLimit: 0,
    });
  }

  async run(message, { username }) {
    const user = await User.findOne({ discordId: message.author.id, username });

    if (!user) {
      message.reply('Your account is not linked to any STEEM account.');
    } else if (user.verified) { // Verified and adding role
      const registerdRole = message.guild.roles.find('name', config.USER_ROLE);
      if (registerdRole) {
        message.member.addRole(registerdRole);
      }

      message.reply('Your are already a verified user.');
    } else {
      const history = await steem.api.getAccountHistoryAsync(username, -1, 100);

      // Checking if the user sent micro transfer with correct memo
      if (
        history.some(res => (res[1].op[0] === 'transfer' && res[1].op[1].to
        === config.STEEM_ACCOUNT && res[1].op[1].memo.trim() === user.code))
      ) {
        await User.updateOne({ discordId: message.author.id }, { $set: { verified: true } })
          .then(() => {
            // Giving role
            const registerdRole = message.guild.roles.find('name', config.USER_ROLE);
            if (registerdRole) {
              message.member.addRole(registerdRole);
            }

            message.reply('Your registration has been successful.');
          })
          .catch(err => console.log(err));
      } else {
        message.reply('We could not verify your registration at this moment.');
      }
    }
  }
}
