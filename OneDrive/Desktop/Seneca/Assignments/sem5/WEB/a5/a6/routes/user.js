import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import {
  registerUser, checkUser,
  getFavourites, updateFavourites,
  getHistory, updateHistory
} from '../services/user-service.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    await registerUser(req.body.userName, req.body.password, req.body.password2);
    res.status(200).json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ message: err.toString() });
  }
});

router.post('/login', async (req, res) => {
  try {
    const user = await checkUser(req.body.userName, req.body.password);
    const payload = { _id: user._id, userName: user.userName };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(400).json({ message: err.toString() });
  }
});

router.get('/favourites', passport.authenticate('jwt', { session: false }), async (req, res) => {
  res.json(await getFavourites(req.user._id));
});

router.put('/favourites/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  res.json(await updateFavourites(req.user._id, req.params.id, 'add'));
});

router.delete('/favourites/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  res.json(await updateFavourites(req.user._id, req.params.id, 'remove'));
});

router.get('/history', passport.authenticate('jwt', { session: false }), async (req, res) => {
  res.json(await getHistory(req.user._id));
});

router.put('/history/:query', passport.authenticate('jwt', { session: false }), async (req, res) => {
  res.json(await updateHistory(req.user._id, req.params.query, 'add'));
});

router.delete('/history/:query', passport.authenticate('jwt', { session: false }), async (req, res) => {
  res.json(await updateHistory(req.user._id, req.params.query, 'remove'));
});

export default router;
