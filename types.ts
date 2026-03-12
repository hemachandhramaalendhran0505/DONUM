
export type Role = 'donor' | 'volunteer' | 'receiver' | 'ngo';

export type Category = 'Food' | 'Clothes' | 'Books' | 'Stationery' | 'Electronics' | 'Medical' | 'Other';

export type Urgency = 'Low' | 'Medium' | 'High' | 'Critical';

export type Language = 'en' | 'ta' | 'te' | 'hi';

export type City = 'Chennai' | 'Tambaram' | 'Coimbatore' | 'Thanjavur';

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface UserStats {
  donationsCount: number;
  livesImpacted: number;
  wasteDivertedKg: number;
  badges: string[];
}

export interface NGOStats {
  verified: boolean;
  trustScore: number;
  members: number;
}

export interface NGO {
  id: string;
  name: string;
  description: string;
  rating: number; // 1-5
  donationsReceived: number;
  reviews: number;
  image: string;
  geoLocation?: GeoLocation;
  category: Category;
}

export interface Requester {
  id: string;
  name: string;
  organizationName?: string;
  role: 'receiver' | 'ngo';
  geoLocation: GeoLocation;
  category: Category;
  quantityNeeded: number;
  urgency: Urgency;
  description: string;
  status: 'Active' | 'Fulfilled';
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  ngoId?: string; // For NGO Role
  avatarUrl?: string;
  location?: GeoLocation;
  city?: City; 
  isVerified?: boolean;
}

export interface DonationItem {
  id: string;
  title: string;
  description: string;
  category: Category;
  quantity: string;
  quantityNum?: number; 
  location: string;
  geoLocation?: GeoLocation;
  urgency: Urgency;
  status: 'Pending' | 'Matched' | 'Picked Up' | 'Delivered';
  donorName: string;
  donorId?: string;
  contactPhone?: string; 
  expiryDate?: string; 
  createdAt: number;
  images?: string[]; 
  
  // Fulfillment details
  receiverId?: string;
  receiverLocation?: GeoLocation;
  
  // Logistics
  volunteerId?: string;
  volunteerPhone?: string;
  trackerId?: string; 
}
