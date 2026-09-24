import express from 'express';
import { 
  getHazardOverview, 
  dispatchDrone, 
  sendGeofencedBroadcast,
  createCommunityHazard,
  voteCommunityHazard,
  flagCommunityHazard,
  getRouteRecommendations,
  createRouteRecommendation,
  getOpenDataPois,
  syncOpenData
} from '../controllers/hazardController.js';

const router = express.Router();

router.get('/overview', getHazardOverview);
router.get('/open-data', getOpenDataPois);
router.post('/sync-open-data', syncOpenData);
router.get('/recommendations', getRouteRecommendations);
router.post('/recommendations', createRouteRecommendation);
router.post('/community', createCommunityHazard);
router.post('/community/:id/vote', voteCommunityHazard);
router.post('/community/:id/flag', flagCommunityHazard);
router.post('/dispatch-drone', dispatchDrone);
router.post('/broadcast', sendGeofencedBroadcast);

export default router;
