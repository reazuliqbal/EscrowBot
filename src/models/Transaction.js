import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  escrowId: Number,
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  serverId: String,
  amount: Number,
  currency: String,
  buyerApproved: {
    type: Boolean,
    default: false,
  },
  agentApproved: {
    type: Boolean,
    default: false,
  },
  disputed: {
    type: Boolean,
    default: false,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  initiated: {
    type: Boolean,
    default: false,
  },
  ratificationDeadline: Date,
  escrowExpiration: Date,
}, { timestamps: true });

TransactionSchema.statics = {
  getUncompleted() {
    return this.find({ completed: false, disputed: false });
  },

  getUninitiated() {
    return this.find({ completed: false, disputed: false, initiated: false });
  },

  updateTrx(trxId, data) {
    return this.updateOne({ _id: trxId }, { $set: data }).exec();
  },
};

const Transaction = mongoose.model('transaction', TransactionSchema);

export default Transaction;
