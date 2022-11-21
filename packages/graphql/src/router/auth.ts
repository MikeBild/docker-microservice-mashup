import * as express from 'express';
import { generateAccessToken } from '../lib/jwt';

const router = express.Router();

export default router;

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  res.send({ user: username, token: generateAccessToken(username) });
});
