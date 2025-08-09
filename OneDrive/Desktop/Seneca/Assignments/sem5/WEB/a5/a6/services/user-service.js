import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  password: String,
  favourites: [String],
  history: [String],
});

const User = mongoose.model('User', userSchema);

export const registerUser = async (userName, password, password2) => {
  if (password !== password2) throw 'Passwords do not match';
  const existing = await User.findOne({ userName });
  if (existing) throw 'User already exists';
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ userName, password: hash, favourites: [], history: [] });
  return await user.save();
};

export const checkUser = async (userName, password) => {
  const user = await User.findOne({ userName });
  if (!user || !(await bcrypt.compare(password, user.password))) throw 'Invalid credentials';
  return user;
};

export const getUserById = async (_id) => await User.findById(_id);

export const getFavourites = async (_id) => {
  const user = await getUserById(_id);
  return user?.favourites || [];
};

export const updateFavourites = async (_id, id, action) => {
  const update = action === 'add' ? { $addToSet: { favourites: id } } : { $pull: { favourites: id } };
  const user = await User.findByIdAndUpdate(_id, update, { new: true });
  return user.favourites;
};

export const getHistory = async (_id) => {
  const user = await getUserById(_id);
  return user?.history || [];
};

export const updateHistory = async (_id, query, action) => {
  const update = action === 'add' ? { $addToSet: { history: query } } : { $pull: { history: query } };
  const user = await User.findByIdAndUpdate(_id, update, { new: true });
  return user.history;
};
