import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import userRoutes from './routes/user.js';
import { getUserById } from './services/user-service.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Starting log
console.log('Starting User API...');

// JWT Strategy
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};
passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    const user = await getUserById(jwt_payload._id);
    return user ? done(null, user) : done(null, false);
  } catch (err) {
    return done(err, false);
  }
}));
app.use(passport.initialize());

// Routes
app.use('/api/user', userRoutes);

// Connect to MongoDB and Start Server
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(3000, () => console.log('🚀 User API running on port 3000'));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
  });
