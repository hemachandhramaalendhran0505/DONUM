import React, { useState, useEffect } from 'react';
import { DonationItem } from '../types';
import { MapPin, Navigation, Loader, CheckCircle, ToggleLeft, ToggleRight, XCircle, ShieldCheck, Phone } from 'lucide-react';
import { smartSortTasks } from '../services/geminiService';

interface VolunteerFeedProps {
  donations: DonationItem[];
  onAccept?: (item: DonationItem) => void;
  onCancel?: (item: DonationItem) => void;
}

const VolunteerFeed: React.FC<VolunteerFeedProps> = ({ donations, onAccept, onCancel }) => {
  const [sortedDonations, setSortedDonations] = useState<DonationItem[]>(donations);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // Show Matched (Ready for Pickup) first
  const activeDonations = donations.filter(d => d.status === 'Matched');

  const handleSmartSort = async () => {
    setIsOptimizing(true);
    const sortedIds = await smartSortTasks(activeDonations);
    
    const sorted = [...activeDonations].sort((a, b) => {
        return sortedIds.indexOf(a.id) - sortedIds.indexOf(b.id);
    });
    
    setSortedDonations(sorted);
    setIsOptimizing(false);
  };

  useEffect(() => {
    setSortedDonations(activeDonations);
  }, [donations]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Volunteer Hub</h2>
          <p className="text-gray-500">Go online to receive assignment notifications.</p>
        </div>
        
        <div className="flex items-center gap-3">
             <span className={`text-sm font-bold ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                 {isOnline ? 'You are Online' : 'You are Offline'}
             </span>
             <button onClick={() => setIsOnline(!isOnline)}>
                 {isOnline ? (
                     <ToggleRight size={40} className="text-green-500" />
                 ) : (
                     <ToggleLeft size={40} className="text-gray-300" />
                 )}
             </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
         <h3 className="font-bold text-lg">Assignments Ready for Pickup</h3>
         <button
          onClick={handleSmartSort}
          disabled={isOptimizing}
          className="text-sm bg-black hover:bg-gray-800 text-yellow-400 px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-all disabled:opacity-70 font-bold border border-yellow-500"
        >
          {isOptimizing ? <Loader className="animate-spin" size={14} /> : <Navigation size={14} />}
          <span>Optimize Route</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        {!isOnline ? (
             <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <ShieldCheck size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Please go <span className="font-bold text-green-600">Online</span> to see available tasks.</p>
             </div>
        ) : sortedDonations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No pending assignments nearby.</p>
          </div>
        ) : (
          sortedDonations.map((item) => (
            <div 
              key={item.id} 
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group"
            >
               {/* Tracker ID Badge */}
               {item.trackerId && (
                   <div className="absolute top-0 right-0 bg-black text-yellow-400 text-xs font-mono px-2 py-1 rounded-bl-lg">
                       TRK: {item.trackerId}
                   </div>
               )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-1">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                       item.urgency === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.urgency}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-1 text-gray-400" />
                      Pickup: {item.location}
                    </div>
                    {item.receiverLocation && (
                        <div className="flex items-center text-blue-600 font-medium">
                            <Navigation size={16} className="mr-1" />
                            Dropoff: {item.receiverLocation.address || "Recipient Location"}
                        </div>
                    )}
                  </div>

                  {/* Contact Info - Visible only when actively viewing tasks */}
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center text-sm">
                          <span className="text-gray-500 mr-2">Donor:</span>
                          <span className="font-medium">{item.donorName}</span>
                          {item.contactPhone && (
                              <a href={`tel:${item.contactPhone}`} className="ml-2 flex items-center text-brand-600 hover:text-brand-800 bg-brand-50 px-2 py-0.5 rounded-full">
                                  <Phone size={12} className="mr-1" /> {item.contactPhone}
                              </a>
                          )}
                      </div>
                      {item.receiverId && (
                          <div className="flex items-center text-sm">
                              <span className="text-gray-500 mr-2">Receiver ID:</span>
                              <span className="font-medium">{item.receiverId}</span>
                              {/* In a real app we would have receiver's phone in DonationItem or fetch it */}
                              <span className="ml-2 flex items-center text-gray-400 text-xs">
                                  (Details on Acceptance)
                              </span>
                          </div>
                      )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button 
                        onClick={() => onCancel && onCancel(item)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-2 border border-transparent hover:border-red-100 rounded"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onAccept && onAccept(item)}
                        className="bg-brand-500 hover:bg-brand-600 text-black px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center"
                    >
                        Start Delivery <Navigation size={14} className="ml-1" />
                    </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VolunteerFeed;