
import React, { useState } from 'react';
import { DonationItem, GeoLocation, Category } from '../types';
import { MapPin, Package, Clock, CheckCircle, AlertCircle, PlusCircle, Loader2, Phone, User, Truck } from 'lucide-react';

interface ReceiverFeedProps {
  donations: DonationItem[];
  userLocation?: GeoLocation;
  userId?: string;
  onClaim: (item: DonationItem) => void;
  onRequestSubmit: (request: any) => void;
}

const ReceiverFeed: React.FC<ReceiverFeedProps> = ({ donations, userLocation, userId, onClaim, onRequestSubmit }) => {
  const [filter, setFilter] = useState('All');
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  // Request Form State
  const [reqCategory, setReqCategory] = useState<Category>('Food');
  const [reqQuantity, setReqQuantity] = useState<number>(5);
  const [reqUrgency, setReqUrgency] = useState('High');
  const [reqLocation, setReqLocation] = useState<GeoLocation | null>(null);
  const [reqPhone, setReqPhone] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Filter logic: Show only Pending items (available)
  const availableItems = donations.filter(d => 
    d.status === 'Pending' && (filter === 'All' || d.category === filter)
  );

  // My Claimed Items
  const myClaims = donations.filter(d => d.receiverId === userId);

  const handleLocationDetect = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setReqLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: "Current Location"
          });
          setIsLocating(false);
        },
        (error) => {
          console.warn("Location Error in Request Form", error.message);
          alert("Could not detect location automatically. Please enable GPS.");
          setIsLocating(false);
        }
      );
    } else {
        alert("Geolocation not supported");
        setIsLocating(false);
    }
  };

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (reqCategory === 'Food' && reqQuantity < 5) {
      alert("Minimum food request quantity is 5 meals.");
      return;
    }
    if (!reqLocation) {
      alert("Please update your current location to request items.");
      return;
    }
    if (!reqPhone) {
        alert("Contact number is required.");
        return;
    }

    onRequestSubmit({
        category: reqCategory,
        quantity: reqQuantity,
        urgency: reqUrgency,
        location: reqLocation,
        contactPhone: reqPhone
    });
    
    setShowRequestForm(false);
    alert("Request submitted successfully! Donors will be notified.");
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Request Button */}
      <div className="bg-brand-50 border border-brand-200 p-4 rounded-xl mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h3 className="text-lg font-bold text-gray-900">Need specific items?</h3>
            <p className="text-sm text-gray-600">Post a request for food (min 5 meals), clothes, or essentials.</p>
        </div>
        <button 
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="bg-brand-500 hover:bg-brand-600 text-black px-6 py-2 rounded-lg font-bold flex items-center shadow-sm"
        >
            <PlusCircle size={18} className="mr-2" />
            {showRequestForm ? 'Cancel Request' : 'Create Request'}
        </button>
      </div>

      {/* Request Form */}
      {showRequestForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8 animate-fade-in relative z-10">
            <h3 className="text-xl font-bold mb-4">Create New Request</h3>
            <form onSubmit={handleRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select 
                            value={reqCategory}
                            onChange={(e) => setReqCategory(e.target.value as Category)}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border"
                        >
                            {['Food', 'Clothes', 'Books', 'Medical'].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity (Min 5 for Food)</label>
                        <input 
                            type="number"
                            min={reqCategory === 'Food' ? 5 : 1}
                            value={reqQuantity}
                            onChange={(e) => setReqQuantity(parseInt(e.target.value))}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border"
                        />
                        {reqCategory === 'Food' && reqQuantity < 5 && (
                            <p className="text-xs text-red-500 mt-1">Minimum 5 meals required.</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                    <div className="relative mt-1">
                        <input
                            type="tel"
                            required
                            value={reqPhone}
                            onChange={(e) => setReqPhone(e.target.value)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2 pl-9"
                            placeholder="Enter mobile number"
                        />
                        <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Current Location (Required)</label>
                    <button 
                        type="button"
                        onClick={handleLocationDetect}
                        className={`mt-1 w-full flex items-center justify-center p-3 border rounded-lg ${
                            reqLocation ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-700'
                        }`}
                    >
                        {isLocating ? <Loader2 className="animate-spin mr-2" /> : <MapPin className="mr-2" />}
                        {reqLocation ? 'Location Captured' : 'Tap to Update Location'}
                    </button>
                </div>

                <button 
                    type="submit"
                    className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition-colors"
                >
                    Submit Request
                </button>
            </form>
        </div>
      )}

      {/* My Claims Section */}
      {myClaims.length > 0 && (
          <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Package className="mr-2 text-brand-600" /> My Active Claims
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myClaims.map(item => (
                      <div key={item.id} className="bg-green-50 border border-green-200 p-4 rounded-xl shadow-sm">
                          <div className="flex justify-between items-start">
                              <h3 className="font-bold text-gray-800">{item.title}</h3>
                              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-bold uppercase">{item.status}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          
                          {/* Status Tracker */}
                          <div className="mt-4 pt-3 border-t border-green-200">
                              {item.volunteerId ? (
                                  <div className="flex items-center text-sm font-medium text-gray-700">
                                      <Truck size={16} className="mr-2 text-brand-600" />
                                      <span>Assigned Volunteer: {item.trackerId}</span>
                                      {item.volunteerPhone && (
                                          <a href={`tel:${item.volunteerPhone}`} className="ml-auto flex items-center bg-white border border-gray-300 px-2 py-1 rounded-md text-xs hover:bg-gray-50">
                                              <Phone size={12} className="mr-1 text-green-600" />
                                              Call Volunteer
                                          </a>
                                      )}
                                  </div>
                              ) : (
                                  <div className="flex items-center text-sm text-gray-500 italic">
                                      <Clock size={16} className="mr-2" />
                                      Waiting for volunteer assignment...
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Feed Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Active Donations Nearby</h2>
          <p className="text-gray-500">Showing items within ~5km radius.</p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', 'Food', 'Clothes', 'Books', 'Other'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === cat 
                ? 'bg-black text-yellow-400' 
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableItems.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No active donations in this category nearby.</p>
          </div>
        ) : (
          availableItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                   <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase mb-2 ${
                        item.urgency === 'Critical' ? 'bg-red-100 text-red-700' : 
                        item.urgency === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {item.urgency} Priority
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">{item.title}</h3>
                   </div>
                   <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                      <Package size={20} />
                   </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-400" />
                    {item.location}
                    <span className="text-xs text-gray-400 ml-1">(~2.5 km)</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-gray-400" />
                    Posted {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="flex items-center text-gray-800 font-medium">
                     <span className="mr-2">📦</span> {item.quantity}
                  </div>
                </div>

                <button
                  onClick={() => onClaim(item)}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-black font-bold py-2.5 rounded-lg flex items-center justify-center transition-colors"
                >
                  <CheckCircle size={18} className="mr-2" />
                  Claim Donation
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReceiverFeed;
