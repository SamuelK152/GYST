import mongoose from 'mongoose';

const journalLinkSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ['goal', 'project', 'task', 'income', 'expense'],
      required: true
    },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true }
  },
  { _id: false }
);

const journalEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true },
    content: { type: String, required: true, trim: true },
    links: [journalLinkSchema]
  },
  { timestamps: true }
);

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
export default JournalEntry;
