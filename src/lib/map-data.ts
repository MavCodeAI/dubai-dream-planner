export interface LocationData {
  id: string;
  name: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: 'attraction' | 'hotel' | 'restaurant' | 'shopping' | 'transport';
  description: string;
}

export const MOCK_LOCATIONS: LocationData[] = [
  // Dubai Locations
  {
    id: 'burj-khalifa',
    name: 'Burj Khalifa',
    city: 'dubai',
    coordinates: { lat: 25.1972, lng: 55.2744 },
    type: 'attraction',
    description: 'World\'s tallest building with observation deck'
  },
  {
    id: 'dubai-mall',
    name: 'Dubai Mall',
    city: 'dubai',
    coordinates: { lat: 25.1972, lng: 55.2744 },
    type: 'shopping',
    description: 'World\'s largest shopping mall'
  },
  {
    id: 'dubai-fountain',
    name: 'Dubai Fountain',
    city: 'dubai',
    coordinates: { lat: 25.1972, lng: 55.2744 },
    type: 'attraction',
    description: 'World\'s largest choreographed fountain'
  },
  {
    id: 'palm-jumeirah',
    name: 'Palm Jumeirah',
    city: 'dubai',
    coordinates: { lat: 25.1125, lng: 55.1397 },
    type: 'attraction',
    description: 'Artificial archipelago in the shape of a palm tree'
  },
  {
    id: 'burj-al-arab',
    name: 'Burj Al Arab',
    city: 'dubai',
    coordinates: { lat: 25.1412, lng: 55.1852 },
    type: 'hotel',
    description: 'Luxury hotel shaped like a sail'
  },
  {
    id: 'dubai-marina',
    name: 'Dubai Marina',
    city: 'dubai',
    coordinates: { lat: 25.0772, lng: 55.1334 },
    type: 'attraction',
    description: 'Waterfront district with marina and promenade'
  },
  {
    id: 'jbr-beach',
    name: 'JBR Beach',
    city: 'dubai',
    coordinates: { lat: 25.0849, lng: 55.1389 },
    type: 'attraction',
    description: 'Popular beach with white sand and clear waters'
  },
  {
    id: 'global-village',
    name: 'Global Village',
    city: 'dubai',
    coordinates: { lat: 25.0547, lng: 55.2370 },
    type: 'attraction',
    description: 'Cultural and entertainment park with pavilions from around the world'
  },
  
  // Abu Dhabi Locations
  {
    id: 'sheikh-zayed-grand-mosque',
    name: 'Sheikh Zayed Grand Mosque',
    city: 'abu-dhabi',
    coordinates: { lat: 24.4126, lng: 54.4477 },
    type: 'attraction',
    description: 'Magnificent mosque with stunning architecture'
  },
  {
    id: 'louvre-abu-dhabi',
    name: 'Louvre Abu Dhabi',
    city: 'abu-dhabi',
    coordinates: { lat: 24.5340, lng: 54.3987 },
    type: 'attraction',
    description: 'Art and civilization museum with iconic dome'
  },
  {
    id: 'yas-island',
    name: 'Yas Island',
    city: 'abu-dhabi',
    coordinates: { lat: 24.4847, lng: 54.6066 },
    type: 'attraction',
    description: 'Entertainment island with Ferrari World and Yas Marina Circuit'
  },
  {
    id: 'ferrari-world',
    name: 'Ferrari World',
    city: 'abu-dhabi',
    coordinates: { lat: 24.4847, lng: 54.6066 },
    type: 'attraction',
    description: 'Indoor theme park with Ferrari-themed rides'
  },
  {
    id: 'yas-marina-circuit',
    name: 'Yas Marina Circuit',
    city: 'abu-dhabi',
    coordinates: { lat: 24.4672, lng: 54.6031 },
    type: 'attraction',
    description: 'Formula 1 racing circuit'
  },
  {
    id: 'qasr-al-watan',
    name: 'Qasr Al Watan',
    city: 'abu-dhabi',
    coordinates: { lat: 24.4158, lng: 54.4532 },
    type: 'attraction',
    description: 'Presidential palace with stunning architecture'
  },
  {
    id: 'corniche-abu-dhabi',
    name: 'Corniche Abu Dhabi',
    city: 'abu-dhabi',
    coordinates: { lat: 24.4875, lng: 54.3763 },
    type: 'attraction',
    description: 'Waterfront promenade with beaches and parks'
  },
  
  // Sharjah Locations
  {
    id: 'sharjah-museum',
    name: 'Sharjah Museum of Islamic Civilization',
    city: 'sharjah',
    coordinates: { lat: 25.3572, lng: 55.3986 },
    type: 'attraction',
    description: 'Museum showcasing Islamic art and culture'
  },
  {
    id: 'al-noor-mosque',
    name: 'Al Noor Mosque',
    city: 'sharjah',
    coordinates: { lat: 25.3374, lng: 55.3939 },
    type: 'attraction',
    description: 'Beautiful mosque with Ottoman-style architecture'
  },
  {
    id: 'al-majaz-waterfront',
    name: 'Al Majaz Waterfront',
    city: 'sharjah',
    coordinates: { lat: 25.3292, lng: 55.3776 },
    type: 'attraction',
    description: 'Waterfront area with fountain and recreational facilities'
  },
  {
    id: 'sharjah-aquarium',
    name: 'Sharjah Aquarium',
    city: 'sharjah',
    coordinates: { lat: 25.3225, lng: 55.3847 },
    type: 'attraction',
    description: 'Aquarium featuring marine life of the Arabian Gulf'
  },
  
  // Ras Al Khaimah Locations
  {
    id: 'jebel-jais',
    name: 'Jebel Jais',
    city: 'ras-al-khaimah',
    coordinates: { lat: 25.9444, lng: 56.0833 },
    type: 'attraction',
    description: 'Highest mountain in UAE with zip line and hiking trails'
  },
  {
    id: 'al-hamra-marina',
    name: 'Al Hamra Marina',
    city: 'ras-al-khaimah',
    coordinates: { lat: 25.6472, lng: 55.7139 },
    type: 'attraction',
    description: 'Marina with yachts and waterfront dining'
  },
  {
    id: 'al-marjan-island',
    name: 'Al Marjan Island',
    city: 'ras-al-khaimah',
    coordinates: { lat: 25.6972, lng: 55.7861 },
    type: 'attraction',
    description: 'Artificial island with beaches and resorts'
  },
  
  // Fujairah Locations
  {
    id: 'fujairah-fort',
    name: 'Fujairah Fort',
    city: 'fujairah',
    coordinates: { lat: 25.1222, lng: 56.3333 },
    type: 'attraction',
    description: 'Historic fort with panoramic views'
  },
  {
    id: 'al-ayyah-madhab',
    name: 'Al Ayyah Madhab',
    city: 'fujairah',
    coordinates: { lat: 25.0833, lng: 56.3167 },
    type: 'attraction',
    description: 'Natural hot springs and waterfall'
  },
  {
    id: 'snoopy-island',
    name: 'Snoopy Island',
    city: 'fujairah',
    coordinates: { lat: 25.1500, lng: 56.3667 },
    type: 'attraction',
    description: 'Rock formation popular for snorkeling and diving'
  },
  
  // Ajman Locations
  {
    id: 'ajman-museum',
    name: 'Ajman Museum',
    city: 'ajman',
    coordinates: { lat: 25.4139, lng: 55.4458 },
    type: 'attraction',
    description: 'Museum housed in an 18th-century fort'
  },
  {
    id: 'ajman-beach',
    name: 'Ajman Beach',
    city: 'ajman',
    coordinates: { lat: 25.4167, lng: 55.4389 },
    type: 'attraction',
    description: 'Quiet beach with golden sand'
  },
  {
    id: 'al-zorah-nature-reserve',
    name: 'Al Zorah Nature Reserve',
    city: 'ajman',
    coordinates: { lat: 25.4167, lng: 55.4389 },
    type: 'attraction',
    description: 'Mangrove forest with bird watching and kayaking'
  },
  
  // Umm Al Quwain Locations
  {
    id: 'dreamland-aqua-park',
    name: 'Dreamland Aqua Park',
    city: 'umm-al-quwain',
    coordinates: { lat: 25.5167, lng: 55.5500 },
    type: 'attraction',
    description: 'Water park with slides and pools'
  },
  {
    id: 'umm-al-quwain-beach',
    name: 'Umm Al Quwain Beach',
    city: 'umm-al-quwain',
    coordinates: { lat: 25.5500, lng: 55.5667 },
    type: 'attraction',
    description: 'Peaceful beach with clear waters'
  },
  {
    id: 'al-khor-park',
    name: 'Al Khor Park',
    city: 'umm-al-quwain',
    coordinates: { lat: 25.5167, lng: 55.5500 },
    type: 'attraction',
    description: 'Park with mangroves and wildlife'
  }
];

export function getLocationsByCity(city: string): LocationData[] {
  return MOCK_LOCATIONS.filter(location => location.city === city);
}

export function getLocationById(id: string): LocationData | undefined {
  return MOCK_LOCATIONS.find(location => location.id === id);
}

export function getAllLocations(): LocationData[] {
  return MOCK_LOCATIONS;
}
