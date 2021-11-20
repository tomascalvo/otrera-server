import mongoose from 'mongoose';

const connectionRequestSchema = mongoose.Schema(
{
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  forTrainer: {
    type: Boolean,
    default: false,
  },
  forTrainee: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
},
{
  timestamps: true
}
);

const ConnectionRequest = mongoose.model('ConnectionRequest', connectionRequestSchema);

export default ConnectionRequest;