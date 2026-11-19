/**
 * Verified Destination Image Resolver
 * Ensures destination images accurately match actual tourist destinations.
 * Never displays an unrelated monument photo for airports, mountains, or unlisted places.
 */

export const VERIFIED_DESTINATION_IMAGES = [
  {
    keywords: ['agra airport', 'kheria airport', 'airport', 'aerodrome', 'air terminal', 'runway', 'air force station agra'],
    imageUrl: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?w=800&q=80',
    description: 'Airport & Aviation Terminal'
  },
  {
    keywords: ['taj mahal', 'agra fort', 'mehtab bagh', 'fatehpur sikri'],
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80',
    description: 'Taj Mahal Monument'
  },
  {
    keywords: ['sanchi stupa', 'sanchi', 'buddhist monument', 'great stupa'],
    imageUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80',
    description: 'Sanchi Buddhist Monument Complex'
  },
  {
    keywords: ['rohtang pass', 'rohtang', 'manali pass'],
    imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
    description: 'Rohtang Mountain Pass'
  },
  {
    keywords: ['solang valley', 'solang', 'atal tunnel'],
    imageUrl: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=800&q=80',
    description: 'Solang Alpine Valley'
  },
  {
    keywords: ['mall road', 'manali town', 'hadimba'],
    imageUrl: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800&q=80',
    description: 'Manali Mall Road & Town'
  },
  {
    keywords: ['bhojpur', 'bhojeshwar'],
    imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80',
    description: 'Bhojpur Mahadev Temple'
  },
  {
    keywords: ['udaygiri', 'caves', 'vidisha'],
    imageUrl: 'https://images.unsplash.com/photo-1599831104328-b141f60ac737?w=800&q=80',
    description: 'Udaygiri Rock Caves'
  },
  {
    keywords: ['guna fort', 'guna', 'bajrangarh'],
    imageUrl: 'https://images.unsplash.com/photo-1599831104328-b141f60ac737?w=800&q=80',
    description: 'Historic Fort & Ridge'
  },
  {
    keywords: ['pangong', 'tso moriri', 'ladakh', 'leh'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
    description: 'Pangong High Altitude Lake'
  },
  {
    keywords: ['rishikesh', 'ganga', 'haridwar'],
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    description: 'Rishikesh River & Foothills'
  },
  {
    keywords: ['valley of flowers', 'chamoli', 'hemkund'],
    imageUrl: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&q=80',
    description: 'Valley of Flowers National Park'
  },
  {
    keywords: ['munnar', 'tea estate', 'idukki', 'kerala'],
    imageUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80',
    description: 'Munnar Tea Hills'
  },
  {
    keywords: ['beach', 'goa', 'anjuna', 'coastal'],
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    description: 'Coastal Safety Trail'
  }
];

// Neutral placeholder for unverified destinations (neutral topographical mountain trail)
export const NEUTRAL_DESTINATION_PLACEHOLDER = 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800&q=80';

/**
 * Returns a verified destination-specific image matching the given destination name.
 * @param {string} destinationName
 * @returns {string} Image URL
 */
export const getDestinationImageUrl = (destinationName) => {
  if (!destinationName || typeof destinationName !== 'string') {
    return NEUTRAL_DESTINATION_PLACEHOLDER;
  }

  const query = destinationName.toLowerCase().trim();

  for (const item of VERIFIED_DESTINATION_IMAGES) {
    if (item.keywords.some(kw => query.includes(kw))) {
      return item.imageUrl;
    }
  }

  return NEUTRAL_DESTINATION_PLACEHOLDER;
};

