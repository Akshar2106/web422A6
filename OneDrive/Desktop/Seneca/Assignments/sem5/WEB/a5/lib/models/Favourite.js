import mongoose from 'mongoose';

const favouriteSchema = new mongoose.Schema({
  objectID: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
});

export default mongoose.models?.Favourite || mongoose.model('Favourite', favouriteSchema);
