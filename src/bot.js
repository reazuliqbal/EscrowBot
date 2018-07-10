import Commando from 'discord.js-commando';
import steem from 'steem';
import mongoose from 'mongoose';
import MongoDBProvider from 'commando-provider-mongo';
import path from 'path';
import { Transaction } from './models';
import config from './config';

// MongoDB connection
mongoose.connect(process.env.MONGODB);

// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;

// Initializing Discord Commando client
const client = new Commando.Client({
  owner: config.OWNER_ID,
  commandPrefix: config.COMMAND_PREFIX,
  disableEveryone: true,
  unknownCommandResponse: false,
  commandEditableDuration: 0,
  nonCommandEditable: false,
});

// Finding and auto approving transaction
async function manageTrxs() {
  const uncompleted = await Transaction.getUncompleted().populate('seller', 'username');

  if (uncompleted.length > 0) {
    uncompleted.forEach((trx) => {
      steem.api.getEscrow(trx.seller.username, trx.escrowId, async (err, result) => {
        if (!err) {
          if (result !== null) {
            if (result.to_approved && !result.agent_approved) {
              // Agent approving escrow
              await steem.broadcast.escrowApproveAsync(
                config.ACTIVE_KEY,
                result.from,
                result.to,
                config.STEEM_ACCOUNT,
                config.STEEM_ACCOUNT,
                trx.escrowId,
                true,
              );
            }

            // Updating transaction status on database
            await Transaction.updateTrx(trx._id, {
              initiated: true,
              buyerApproved: result.to_approved,
              agentApproved: result.agent_approved,
              disputed: result.disputed,
            });
          }
        } else {
          console.log(err);
        }
      });
    });
  }
}

setInterval(manageTrxs, 60000); // Running every minute

// Setting bot's settings provider to MongoDB
client.setProvider((mongoose.connection)
  .then(db => new MongoDBProvider(db)))
  .catch(console.error);

// Registering all commands
client.registry
  .registerGroups([
    ['exchange', 'STEEM/SBD exchange related commands'],
    ['user', 'User management related commands'],
    ['admin', 'Administrative commands'],
  ])
  .registerDefaults()
  .registerCommandsIn(path.join(__dirname, 'commands'));

client.on('ready', () => {
  console.log(`${new Date()}: ${client.user.username} bot is ready.`);
});

// When bot is added to a new server
client.on('guildCreate', (guild) => {
  // Creating user role if not found
  if (!guild.roles.find('name', config.USER_ROLE)) {
    guild.createRole({
      name: config.USER_ROLE,
      mentionable: true,
    })
      .catch(e => console.log(e));
  }

  // Creating handler role if not found
  if (!guild.roles.find('name', config.HANDLER_ROLE)) {
    guild.createRole({
      name: config.HANDLER_ROLE,
      mentionable: true,
    })
      .then((role) => {
        guild.owner.addRole(role);
      })
      .catch(e => console.log(e));
  }
});

client.login(config.BOT_TOKEN);
