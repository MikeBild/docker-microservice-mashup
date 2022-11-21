import { join } from 'path';
import * as express from 'express';

const router = express.Router();

export default router;

router.get('/:id', async (req, res) => {
  res.sendFile(join(__dirname, `../../assets/${req.params.id}`));
});
