import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: String,
  discordId: {
    type: String,
    unique: true,
    dropDups: true,
  },
  serverId: String,
  code: String,
  verified: {
    type: Boolean,
    default: false,
  },
  banned: {
    type: Boolean,
    default: false,
  },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'transaction' }],
}, { timestamps: true });

UserSchema.statics = {
  // Finding buyer and seller via discord id
  async findParties(seller, buyer) {
    const users = await this.find({
      discordId: { $in: [seller, buyer] },
      verified: true,
    });
    return users.reduce((obj, item) => {
      const parties = obj;
      if (item.discordId === seller) {
        parties.seller = item;
      } else {
        parties.buyer = item;
      }
      return parties;
    }, {});
  },
};

const User = mongoose.model('user', UserSchema);

export default User;
