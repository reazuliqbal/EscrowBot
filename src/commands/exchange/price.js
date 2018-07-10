import got from 'got';
import { Command } from 'discord.js-commando';

export default class PriceCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'price',
      group: 'exchange',
      memberName: 'price',
      description: 'Check current price for STEEM and SBD.',
      examples: ['price STEEM'],
      throttling: {
        usages: 2,
        duration: 10,
      },
      guildOnly: true,
      args: [
        {
          key: 'amount',
          label: 'AMOUNT',
          prompt: '',
          type: 'float',
          default: 1,
        },
        {
          key: 'symbol',
          label: 'SYMBOL',
          prompt: '',
          type: 'string',
          default: 'SBD',
          parse: symbols => symbols.toUpperCase(),
        },
      ],
      argsPromptLimit: 0,
    });
  }

  async run(message, { amount, symbol }) {
    // Determining price per USD based on settings
    const pricePerUsd = parseFloat(message.client.provider.get('global', 'price', 80)).toFixed(2);

    let id = '';
    switch (symbol) {
      case 'BTC':
        id = 1;
        break;

      case 'STEEM':
        id = 1230;
        break;

      default:
        id = 1312;
        break;
    }
    const data = await got(`https://api.coinmarketcap.com/v2/ticker/${id}`, { json: true });

    message.say(`
    \`\`\`Current price of ${amount} ${data.body.data.symbol} is ${parseFloat(data.body.data.quotes.USD.price * amount).toFixed(2)} USD or ${parseFloat(data.body.data.quotes.USD.price * amount * pricePerUsd).toFixed(0)} BDT\`\`\`
    `);
  }
}
