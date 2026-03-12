
import React, { useEffect, useState } from 'react';
import { UserStats, User, Role, City, NGO } from '../types';
import { generateImpactStory } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, Leaf, Users, Zap, Calendar, Package, Download, Trophy, MapPin, Building2, Star, ThumbsUp } from 'lucide-react';

interface ImpactDashboardProps {
  currentUser: User;
  stats: UserStats;
}

// Mock Data for Leaderboard
const mockLeaderboard: User[] = [
  { id: 'u1', name: 'Ramesh K', role: 'donor', city: 'Chennai', location: {lat:0, lng:0}, isVerified: true },
  { id: 'u2', name: 'Sita L', role: 'donor', city: 'Coimbatore', location: {lat:0, lng:0}, isVerified: true },
  { id: 'u3', name: 'Arun V', role: 'volunteer', city: 'Chennai', location: {lat:0, lng:0}, isVerified: true },
  { id: 'u4', name: 'Priya M', role: 'volunteer', city: 'Thanjavur', location: {lat:0, lng:0}, isVerified: true },
  { id: 'u5', name: 'Shelter A', role: 'receiver', city: 'Tambaram', location: {lat:0, lng:0}, isVerified: true },
  { id: 'u6', name: 'John D', role: 'donor', city: 'Tambaram', location: {lat:0, lng:0}, isVerified: true },
];

const mockScores: Record<string, number> = {
    'u1': 150, // 150 meals
    'u2': 100, // 100 meals
    'u3': 180, // 180 rides
    'u4': 50,  // 50 rides
    'u5': 300, // 300 requests fulfilled
    'u6': 60,  // 60 donations
};

const suggestedNGOs: NGO[] = [
    {
        id: 'ngo1',
        name: 'Akshaya Patra',
        description: 'Feeding millions of children across India.',
        rating: 4.9,
        donationsReceived: 50000,
        reviews: 1200,
        image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=100&h=100',
        category: 'Food'
    },
    {
        id: 'ngo2',
        name: 'Goonj',
        description: 'Turning urban waste into rural resources.',
        rating: 4.8,
        donationsReceived: 32000,
        reviews: 950,
        image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=100&h=100',
        category: 'Clothes'
    },
    {
        id: 'ngo3',
        name: 'Robin Hood Army',
        description: 'Zero funds organization fighting hunger.',
        rating: 5.0,
        donationsReceived: 85000,
        reviews: 2100,
        image: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=100&h=100',
        category: 'Food'
    },
    {
        id: 'ngo4',
        name: 'GiveIndia',
        description: 'India\'s largest donation platform.',
        rating: 4.7,
        donationsReceived: 60000,
        reviews: 1500,
        image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=100&h=100',
        category: 'Other'
    }
];

interface LeaderboardRowProps {
  rank: number;
  user: User;
  score: number;
  role: Role;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ rank, user, score, role }) => (
    <div className={`flex items-center p-4 rounded-lg border ${
        rank === 1 ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-100'
    }`}>
       <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold mr-4 ${
           rank === 1 ? 'bg-yellow-400 text-black' : 
           rank === 2 ? 'bg-gray-300 text-black' :
           rank === 3 ? 'bg-orange-300 text-black' : 'bg-gray-100 text-gray-500'
       }`}>
           {rank}
       </div>
       <div className="flex-1">
           <p className="font-bold text-gray-900">{user.name}</p>
           <p className="text-xs text-gray-500 flex items-center">
               <MapPin size={10} className="mr-1" /> {user.city}
           </p>
       </div>
       <div className="text-right">
           <p className="font-bold text-xl text-brand-700">{score}</p>
           <p className="text-xs text-gray-400">
               {role === 'donor' ? 'Meals/Items' : role === 'volunteer' ? 'Rides' : 'Requests'}
           </p>
       </div>
    </div>
);

const ImpactDashboard: React.FC<ImpactDashboardProps> = ({ currentUser, stats }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'certificate' | 'ngo'>('overview');
  const [story, setStory] = useState('Generating your impact story...');
  
  // Leaderboard filters
  const [lbCity, setLbCity] = useState<City | 'All'>('All');
  const [lbRole, setLbRole] = useState<Role>('donor');

  useEffect(() => {
    generateImpactStory(stats).then(setStory);
  }, [stats]);

  useEffect(() => {
      // Auto-switch to NGO tab if user is NGO
      if (currentUser.role === 'ngo') {
          setActiveTab('ngo');
      }
  }, [currentUser.role]);

  const getFilteredLeaderboard = () => {
    let users = mockLeaderboard.filter(u => u.role === lbRole);
    if (lbCity !== 'All') {
        users = users.filter(u => u.city === lbCity);
    }
    // Sort by score
    return users.sort((a, b) => (mockScores[b.id] || 0) - (mockScores[a.id] || 0));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full md:w-auto self-start overflow-x-auto">
        {['overview', 'leaderboard', 'certificate', currentUser.role === 'ngo' ? 'ngo' : null].filter(Boolean).map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize flex-1 md:flex-none whitespace-nowrap ${
                    activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                {tab === 'ngo' ? 'NGO Hub' : tab}
            </button>
        ))}
      </div>

      {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* AI Story Card */}
            <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border border-gray-800">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-yellow-500 opacity-10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <h3 className="text-xl font-semibold mb-2 flex items-center text-yellow-400">
                        <Zap className="mr-2" /> AI Impact Summary
                    </h3>
                    <p className="text-lg leading-relaxed font-light opacity-95 italic">"{story}"</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-yellow-100 rounded-full text-yellow-700">
                        <Leaf size={32} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Waste Diverted</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.wasteDivertedKg.toFixed(1)} kg</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-black rounded-full text-yellow-400">
                        <Users size={32} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Lives Impacted</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.livesImpacted}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-yellow-400 rounded-full text-black">
                        <Award size={32} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Badges Earned</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.badges.length}</p>
                    </div>
                </div>
            </div>
            
             {/* Chart Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Real-Time Impact</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                     {/* Placeholder for real-time chart */}
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{name: 'Your Impact', val: stats.donationsCount}]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="val" fill="#eab308" name="Donations" radius={[4,4,0,0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            {/* Recent Contributions Table */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                     <h3 className="font-bold text-gray-800">Donation History</h3>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Item</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                         {/* Mock Data for visual structure */}
                         <tr className="hover:bg-gray-50">
                             <td className="px-6 py-3 font-medium text-gray-900">50 Meals</td>
                             <td className="px-6 py-3 text-gray-500">Today</td>
                             <td className="px-6 py-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Matched</span></td>
                         </tr>
                         <tr className="hover:bg-gray-50">
                             <td className="px-6 py-3 font-medium text-gray-900">Children's Books</td>
                             <td className="px-6 py-3 text-gray-500">Yesterday</td>
                             <td className="px-6 py-3"><span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold">Pending</span></td>
                         </tr>
                    </tbody>
                </table>
             </div>
          </div>
      )}

      {activeTab === 'leaderboard' && (
          <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <h2 className="text-2xl font-bold">Top Contributors</h2>
                  <div className="flex gap-2">
                       <select 
                            className="p-2 border rounded-lg"
                            value={lbCity}
                            onChange={(e) => setLbCity(e.target.value as City | 'All')}
                        >
                            <option value="All">All Cities</option>
                            <option value="Chennai">Chennai</option>
                            <option value="Tambaram">Tambaram</option>
                            <option value="Coimbatore">Coimbatore</option>
                            <option value="Thanjavur">Thanjavur</option>
                       </select>
                       <select 
                            className="p-2 border rounded-lg"
                            value={lbRole}
                            onChange={(e) => setLbRole(e.target.value as Role)}
                        >
                            <option value="donor">Donors</option>
                            <option value="volunteer">Volunteers</option>
                            <option value="receiver">Receivers</option>
                       </select>
                  </div>
              </div>

              <div className="space-y-3">
                  {getFilteredLeaderboard().map((user, idx) => (
                      <LeaderboardRow 
                          key={user.id} 
                          rank={idx + 1} 
                          user={user} 
                          score={mockScores[user.id]} 
                          role={lbRole}
                      />
                  ))}
                  {getFilteredLeaderboard().length === 0 && (
                      <p className="text-center text-gray-500 py-10">No data found for this selection.</p>
                  )}
              </div>
          </div>
      )}

      {activeTab === 'certificate' && (
          <div className="flex flex-col items-center animate-fade-in py-8">
              <div className="bg-white p-8 md:p-12 shadow-2xl border-4 border-double border-brand-500 rounded-lg max-w-2xl w-full text-center relative overflow-hidden">
                   {/* Watermark */}
                   <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none">
                       <Award size={300} />
                   </div>
                   
                   <div className="relative z-10">
                       <div className="flex justify-center mb-6">
                           <div className="bg-black text-yellow-400 p-3 rounded-full">
                               <Award size={40} />
                           </div>
                       </div>
                       
                       <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2 uppercase tracking-wider">Certificate of Impact</h1>
                       <p className="text-brand-600 font-bold text-lg mb-8 uppercase tracking-widest">DONUM PLATFORM</p>
                       
                       <p className="text-gray-600 mb-4 italic">This certificate is proudly presented to</p>
                       
                       <h2 className="text-3xl font-bold text-black mb-6 underline decoration-yellow-400 decoration-4 underline-offset-4">
                           {currentUser.name}
                       </h2>
                       
                       <p className="text-gray-600 leading-relaxed mb-8">
                           In recognition of your outstanding contribution during the month of 
                           <span className="font-bold text-black"> {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>.
                           Your dedication has directly impacted <span className="font-bold text-black">{stats.livesImpacted} lives</span> 
                           and diverted <span className="font-bold text-black">{stats.wasteDivertedKg}kg</span> of resources.
                       </p>
                       
                       <div className="flex justify-between items-end border-t border-gray-300 pt-8 mt-8">
                           <div className="text-center">
                               <p className="font-signature text-2xl text-gray-800">Nano Spark</p>
                               <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">AI Verified</p>
                           </div>
                           <div className="text-center">
                               <p className="font-bold text-gray-900">{new Date().toLocaleDateString()}</p>
                               <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Date</p>
                           </div>
                       </div>
                   </div>
              </div>

              <button 
                onClick={() => alert("Certificate downloaded successfully!")}
                className="mt-8 flex items-center px-6 py-3 bg-brand-500 text-black font-bold rounded-full hover:bg-brand-600 shadow-lg transition-transform hover:scale-105"
              >
                  <Download size={20} className="mr-2" /> Download Certificate
              </button>
              <p className="text-xs text-gray-500 mt-2">Auto-generated on the 28th of every month.</p>
          </div>
      )}

      {activeTab === 'ngo' && (
          <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="flex items-center space-x-3 mb-6">
                      <Building2 className="text-brand-600" size={28} />
                      <h2 className="text-2xl font-bold text-gray-900">Partner NGO Hub</h2>
                  </div>
                  
                  {currentUser.role === 'ngo' && (
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-8 flex items-start space-x-3">
                          <CheckCircle className="text-blue-500 mt-1" size={20} />
                          <div>
                              <h4 className="font-bold text-blue-800">Verified Partner Status</h4>
                              <p className="text-sm text-blue-700">Gov ID: {currentUser.ngoId || 'Pending Verification'}</p>
                          </div>
                      </div>
                  )}

                  <h3 className="text-lg font-bold mb-4">Top Rated NGOs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {suggestedNGOs.map(ngo => (
                          <div key={ngo.id} className="border border-gray-100 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow">
                              <img src={ngo.image} alt={ngo.name} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                              <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                      <h4 className="font-bold text-lg">{ngo.name}</h4>
                                      <div className="flex items-center text-yellow-500 text-sm font-bold">
                                          <Star size={14} fill="currentColor" className="mr-1" />
                                          {ngo.rating}
                                      </div>
                                  </div>
                                  <p className="text-sm text-gray-500 mb-2">{ngo.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-gray-400">
                                      <span className="flex items-center"><Package size={12} className="mr-1" /> {ngo.donationsReceived.toLocaleString()} Received</span>
                                      <span className="flex items-center"><ThumbsUp size={12} className="mr-1" /> {ngo.reviews} Reviews</span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ImpactDashboard;

// Helper Icon for NGO section (Used internally but imported from lucide-react)
const CheckCircle = ({className, size}: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
