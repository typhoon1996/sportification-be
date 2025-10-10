import { Router } from 'express';
import { matchController } from '../controllers/MatchController';
import { authenticate } from '../../../../shared/middleware/auth';

const router = Router();

// Match routes
router.post('/', authenticate, matchController.createMatch);
router.get('/', matchController.getMatches);
router.get('/:id', matchController.getMatchById);
router.post('/:id/join', authenticate, matchController.joinMatch);
router.post('/:id/leave', authenticate, matchController.leaveMatch);
router.put('/:id/score', authenticate, matchController.updateScore);
router.put('/:id/status', authenticate, matchController.updateMatchStatus);
router.delete('/:id', authenticate, matchController.deleteMatch);

export default router;
