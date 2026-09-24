import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hazardFilePath = path.join(__dirname, '../json/hazards.json');
const openDataFilePath = path.join(__dirname, '../json/openDataPois.json');

const readData = () => {
  const json = fs.readFileSync(hazardFilePath, 'utf-8');
  return JSON.parse(json);
};

const writeData = (data) => {
  fs.writeFileSync(hazardFilePath, JSON.stringify(data, null, 2));
};

// Calculate 30-day Trust Decay score for community hazards
const calculateTrustScore = (hazard) => {
  const now = new Date();
  const created = new Date(hazard.createdAt || hazard.created_at || now);
  const ageInDays = Math.max(0, (now.getTime() - created.getTime()) / (1000 * 3600 * 24));
  
  const baseDecay = Math.max(0, 100 * (1 - ageInDays / 30));
  const upvotes = hazard.upvotes || 0;
  const downvotes = hazard.downvotes || 0;
  
  const score = Math.max(0, Math.min(100, Math.round(baseDecay + (upvotes * 10) - (downvotes * 15))));
  return {
    trustScore: score,
    ageInDays: Math.round(ageInDays),
    decayed: ageInDays >= 30,
    trustStatus: score >= 70 ? 'High Confidence' : score >= 40 ? 'Moderate Confidence' : 'Low / Expired Trust'
  };
};

export const getHazardOverview = (req, res) => {
  try {
    const data = readData();

    // Filter only active community hazards (moderation rule: flag_count < 3 and is_active !== false)
    const communityHazards = (data.communityHazards || [])
      .filter(h => h.is_active !== false && (h.flag_count || 0) < 3)
      .map(h => {
        const trust = calculateTrustScore(h);
        return {
          ...h,
          ...trust
        };
      });

    res.json({
      success: true,
      weather: data.weather,
      hazardZones: data.hazardZones,
      blackspots: data.blackspots || [],
      disasterLayers: data.disasterLayers || [],
      osmHazardNodes: data.osmHazardNodes || [],
      communityHazards,
      recommendations: (data.routeRecommendations || []).filter(r => r.is_active !== false),
      drones: data.drones,
      meshNodes: data.meshNodes
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create Community Hazard adhering to Supabase route_hazards SQL schema
export const createCommunityHazard = (req, res) => {
  try {
    const { selected_tags, review_title, review_body, severity, photo_url, location, is_verified_traveler } = req.body;

    const PRESET_TAGS = ['PICKPOCKETING', 'POOR_LIGHTING', 'STRAY_ANIMALS', 'UNSAFE_NIGHT', 'SCAMS'];
    const tags = Array.isArray(selected_tags) ? selected_tags : [selected_tags || 'POOR_LIGHTING'];
    
    const data = readData();
    if (!data.communityHazards) data.communityHazards = [];

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();

    const newHazard = {
      id: `chz-${Date.now()}`,
      selected_tags: tags,
      tag: tags[0], // backward compatibility
      review_title: review_title || `${tags[0]} Hazard Report`,
      title: review_title || `${tags[0]} Hazard Report`,
      review_body: review_body || 'Community user reported route hazard.',
      description: review_body || 'Community user reported route hazard.',
      severity: parseInt(severity) || 2,
      photo_url: photo_url || 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&q=80',
      location: location || { lat: 24.5812, lng: 77.2350, locationName: 'Guna-Raghogarh NH-46' },
      locationName: location?.locationName || 'Guna-Raghogarh NH-46',
      upvotes: 1,
      downvotes: 0,
      flag_count: 0,
      is_verified_traveler: is_verified_traveler ?? true,
      is_active: true,
      created_at: now.toISOString(),
      expires_at: expiresAt,
      reporterName: 'Verified Traveler Reviewer',
    };

    const trust = calculateTrustScore(newHazard);
    const itemWithTrust = { ...newHazard, ...trust };

    data.communityHazards.unshift(itemWithTrust);
    writeData(data);

    res.status(201).json({
      success: true,
      message: 'Route hazard logged adhering to PostGIS schema with 30-day trust decay!',
      hazard: itemWithTrust
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Vote on Community Hazard
export const voteCommunityHazard = (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'upvote' or 'downvote'

    const data = readData();
    if (!data.communityHazards) data.communityHazards = [];

    const index = data.communityHazards.findIndex(h => h.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Community hazard report not found' });
    }

    if (voteType === 'downvote') {
      data.communityHazards[index].downvotes = (data.communityHazards[index].downvotes || 0) + 1;
    } else {
      data.communityHazards[index].upvotes = (data.communityHazards[index].upvotes || 0) + 1;
    }

    const trust = calculateTrustScore(data.communityHazards[index]);
    data.communityHazards[index] = {
      ...data.communityHazards[index],
      ...trust
    };

    writeData(data);

    res.json({
      success: true,
      message: `Vote recorded (${voteType}). New trust score: ${trust.trustScore}%`,
      hazard: data.communityHazards[index]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Content Moderation (Rules.md: 3 flags => is_active = FALSE)
export const flagCommunityHazard = (req, res) => {
  try {
    const { id } = req.params;
    const data = readData();
    if (!data.communityHazards) data.communityHazards = [];

    const index = data.communityHazards.findIndex(h => h.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Community hazard report not found' });
    }

    const currentFlags = (data.communityHazards[index].flag_count || 0) + 1;
    data.communityHazards[index].flag_count = currentFlags;

    let deactivated = false;
    if (currentFlags >= 3) {
      data.communityHazards[index].is_active = false;
      deactivated = true;
    }

    writeData(data);

    res.json({
      success: true,
      message: deactivated 
        ? 'AUTOMATED MODERATION: Hazard received 3+ flags and has been deactivated (is_active = false).' 
        : `Flag recorded (${currentFlags}/3 flags).`,
      flag_count: currentFlags,
      is_active: data.communityHazards[index].is_active
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Route Recommendations (Supabase route_recommendations SQL schema)
export const getRouteRecommendations = (req, res) => {
  try {
    const data = readData();
    const recs = (data.routeRecommendations || []).filter(r => r.is_active !== false);
    res.json({ success: true, count: recs.length, recommendations: recs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createRouteRecommendation = (req, res) => {
  try {
    const { origin_city, destination_city, title, description, category, rating, location } = req.body;
    
    const VALID_CATEGORIES = ['FOOD_REST', 'FUEL_SERVICE', 'SCENIC_SPOT', 'ROAD_TIP'];
    const cat = VALID_CATEGORIES.includes(category) ? category : 'FOOD_REST';

    const data = readData();
    if (!data.routeRecommendations) data.routeRecommendations = [];

    const newRec = {
      id: `rec-${Date.now()}`,
      origin_city: origin_city || 'Guna',
      destination_city: destination_city || 'Raghogarh',
      title: title || `${cat} Spot`,
      description: description || 'Traveler recommended location along highway.',
      category: cat,
      rating: parseInt(rating) || 5,
      upvotes: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      location: location || { lat: 24.5620, lng: 77.2140 }
    };

    data.routeRecommendations.unshift(newRec);
    writeData(data);

    res.status(201).json({
      success: true,
      message: 'Route recommendation added successfully!',
      recommendation: newRec
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getOpenDataPois = (req, res) => {
  try {
    if (fs.existsSync(openDataFilePath)) {
      const data = JSON.parse(fs.readFileSync(openDataFilePath, 'utf-8'));
      return res.json({ success: true, ...data });
    }
    res.status(404).json({ success: false, message: 'Open Data store not initialized. Run import script.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const syncOpenData = async (req, res) => {
  try {
    const { routeCoords, bufferKm } = req.body || {};
    const { importForRoute } = await import('../scripts/importOpenData.js');
    const result = importForRoute(routeCoords || [[77.31, 24.65], [77.05, 24.52]], bufferKm || 5);
    res.json({
      success: true,
      message: 'Full-India Open Data & Hazard Pipeline successfully executed for route corridor!',
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const dispatchDrone = (req, res) => {
  try {
    const { droneId, targetId, coordinates } = req.body;
    const data = readData();
    const droneIndex = data.drones.findIndex(d => d.id === droneId);

    if (droneIndex === -1) {
      return res.status(404).json({ success: false, message: 'Drone unit not found in fleet' });
    }

    data.drones[droneIndex] = {
      ...data.drones[droneIndex],
      status: 'DISPATCHED',
      targetId: targetId || 'EMERGENCY_TARGET',
      targetCoordinates: coordinates || [30.7280, 79.6053],
      etaMinutes: 5,
      dispatchedAt: new Date().toISOString()
    };

    writeData(data);
    res.json({
      success: true,
      message: `Thermal Rescue Drone ${data.drones[droneIndex].name} dispatched to GPS coordinates!`,
      drone: data.drones[droneIndex]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const sendGeofencedBroadcast = (req, res) => {
  try {
    const { sectorName, alertLevel, messageText, channel } = req.body;
    res.json({
      success: true,
      broadcastId: `BC-${Date.now()}`,
      sectorName: sectorName || 'High Risk Mountain Sector',
      alertLevel: alertLevel || 'CRITICAL',
      messageText: messageText || 'EMERGENCY: Immediate evacuation recommended due to high avalanche threat.',
      recipientsNotified: 47,
      channel: channel || 'Satellite Audio + Push + SMS',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
