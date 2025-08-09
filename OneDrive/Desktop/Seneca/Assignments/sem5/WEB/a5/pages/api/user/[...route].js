import { getToken } from '@/lib/authenticate';
import clientPromise from '@/lib/mongodb';

export default async function handler(req, res) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = token.sub;
  const [action] = req.query.route;

  const client = await clientPromise;
  const db = client.db('metmuseum');
  const collection = db.collection('users');

  await collection.updateOne(
    { _id: user },
    { $setOnInsert: { favourites: [], history: [] } },
    { upsert: true }
  );

  try {
    switch (action) {
      case 'favourites':
        return handleFavourites(req, res, collection, user);
      case 'history':
        return handleHistory(req, res, collection, user);
      default:
        res.status(404).json({ error: 'Invalid route' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleFavourites(req, res, collection, user) {
  const { id } = req.body;

  switch (req.method) {
    case 'GET':
      const userFavs = await collection.findOne({ _id: user });
      res.json(userFavs.favourites || []);
      break;

    case 'PUT':
      await collection.updateOne(
        { _id: user },
        { $addToSet: { favourites: id } }
      );
      const updatedFavs = await collection.findOne({ _id: user });
      res.json(updatedFavs.favourites);
      break;

    case 'DELETE':
      await collection.updateOne(
        { _id: user },
        { $pull: { favourites: id } }
      );
      const reducedFavs = await collection.findOne({ _id: user });
      res.json(reducedFavs.favourites);
      break;

    default:
      res.status(405).json({ error: 'Method Not Allowed' });
  }
}

async function handleHistory(req, res, collection, user) {
  const { query } = req.body;

  switch (req.method) {
    case 'GET':
      const userData = await collection.findOne({ _id: user });
      res.json(userData.history || []);
      break;

    case 'PUT':
      await collection.updateOne(
        { _id: user },
        { $push: { history: query } }
      );
      const updatedHistory = await collection.findOne({ _id: user });
      res.json(updatedHistory.history);
      break;

    default:
      res.status(405).json({ error: 'Method Not Allowed' });
  }
}
