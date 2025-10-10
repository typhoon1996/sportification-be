import { Router } from 'express';
import { analyticsController } from '../controllers/SimpleAnalyticsController';
import { authenticate } from '../../../../shared/middleware/auth';

const router = Router();

router.get('/overview', authenticate, analyticsController.getOverviewAnalytics);
router.get('/users/:userId?', authenticate, analyticsController.getUserAnalytics);
router.get('/matches/:matchId', authenticate, analyticsController.getMatchAnalytics);
router.get('/insights', authenticate, analyticsController.getInsights);

export default router;
