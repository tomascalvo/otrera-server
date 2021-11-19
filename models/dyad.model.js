import mongoose from 'mongoose';

const dyadSchema = mongoose.Schema({
  monads: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      isTrainer: { type: Boolean, default: false },
      isTrainee: { type: Boolean, default: false },
    },
  ]
});

const Dyad = mongoose.model('Dyad', dyadSchema);

export default Dyad;