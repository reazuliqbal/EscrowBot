# EscrowBot

EscrowBot can be used to facilitate safe exchange of asset(s) between two members (both steem user) from Discord server using Steem Blockchain's escrow functionalities. This bot was inspired by my other project [BDCommunityDiscordBot](https://github.com/CodeBull/BDCommunityDiscordBot).

## How it works?

A registered user can initiate any amount of STEEM or SBD escrow transfer to another registered user. Both will get a DM with escrow transaction preview and a SteemConnect link to initiate or approval. After that, the beneficiary can do the agreed task(s) (eg. transfer of fiat to the initiator) and notify the initiator. Initiator if satisfied can release the escrowed fund to the beneficiary or can dispute the transfer. If the initiator doesn't release after the job was done, the beneficiary can also dispute too. If disputed by any party, a *Dispute Handler* of that server will try to solve the issue(s) and decide who should get the escrowed fund.

This bot can be added on multiple servers, users need to register only once. When this bot is added to a new server, it will try to create *User* and *Dispute Handler* roles and automatically assign server owner as *Dispute Handler*. Each server can have different dispute handlers, they can only release escrows created from their respective servers.


## Commands

This bot has 3 levels of users. General User, Dispute Handlers, and Owner(s). Every registered user is General user and gets a predefined role. Server owner gets Dispute Handler role automatically.

### General User

`register [STEEM USERNAME]`

Links Discord account with Steem account.

`verify [STEEM USERNAME]`

Verifies if a Discord member owns the Steem account.

`balance [STEEM USERNAME]`

Shows STEEM and SBD the account holds.

`exchange [AMOUNT] [CURRENCY] [DISCORD MEMBER]`

Initiates an escrow transfer. Both parties will get a DM from the Bot with the respective link to initiate or approve.

`release [ESCROW ID]`

Generates a hot sign link to release the escrowed fund.

`dispute [ESCROW ID]`

Generates a hot sign link to dispute the transaction.

`status [ESCROW ID]`

Shows current status of the escrow from blockchain.

`price [AMOUNT] [CURRENCY]`

Shows the current price of X amount of Y currency in USD and BDT (can be changed).

### Dispute Handler

`agent-release [ESCROW ID] [DISCORD MEMBER]`

Release the escrowed fund to the Discord member (his/her steem username) after dispute resolution.

### Owner

`set [KEY] [VALUE]`

Saves or changes setting key and value in the database.

`invite`

Generate invite link to add the Bot on other servers.

`servers`

Generate a table with servers and their owners who are currently using the bot.


## Usage Examples

 - Peer to Peer STEEM/SBD to Fiat exchange
 - Exchange of service for STEEM/SBD
 - Valuables exchange between two peers
 - Safe domain transfer

and many more...

## Technologies

 - Node JS
 - Discord.js
 - Discord.js Commando
 - MongoDB
 - Mongoose
 - SteemConnect SDK
 - Steem JS

## Installation

 - Create a [Discord bot](https://discordapp.com/developers/applications/me) and grab its token.
 - Get your [Bitly API](https://dev.bitly.com/) token.
 - Rename `env.example` to `.env` and add you Bot token there
 - Make required changes to `.env` file
 - Change `OWNER_ID` in `src/config.js` to your Discord user ID.
 - Make other changed in `src/config.js` if needed.
 - Open terminal and type `npm install` to install all the dependencies.
 - Run `npm start` to start the bot in production mode or `npm run dev` to start in development mode.

You can run this bot on Heroku. I included Heorku `Procfile` too.

## Contributing

When contributing to this repository, please first discuss the change you wish to make via issue or any other method with the (owner) of this repository. But you are free to make your own copy and use it.
