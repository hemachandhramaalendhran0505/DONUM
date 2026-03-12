
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DonationForm from './components/DonationForm';
import VolunteerFeed from './components/VolunteerFeed';
import ImpactDashboard from './components/ImpactDashboard';
import Auth from './components/Auth';
import ChatBot from './components/ChatBot';
import MapView from './components/MapView';
import OnboardingTour from './components/OnboardingTour';
import ReceiverFeed from './components/ReceiverFeed';
import NotificationToast from './components/NotificationToast';
import { DonationItem, Role, User, Category, Language, UserStats, NGO, Requester } from './types';
import { translations } from './i18n/translations';
import { ArrowRight, LogOut, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTask, setActiveTask] = useState<DonationItem | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    donationsCount: 0,
    livesImpacted: 0,
    wasteDivertedKg: 0,
    badges: ['New Comer']
  });

  const [donations, setDonations] = useState<DonationItem[]>([
    {
      id: '1',
      title: '50 Meals (Leftover Wedding Catering)',
      category: 'Food',
      quantity: '50 boxes',
      quantityNum: 50,
      location: 'Koramangala 4th Block',
      geoLocation: { lat: 12.934533, lng: 77.626579 },
      urgency: 'Critical',
      description: 'Vegetarian biryani and curry.',
      status: 'Matched',
      donorName: 'Aditi Events',
      contactPhone: '9876543210',
      createdAt: Date.now() - 3600000,
      expiryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Expires tomorrow
      images: [],
      receiverLocation: { lat: 12.925000, lng: 77.610000, address: "Madiwala Shelter" },
      receiverId: 'shelter-1',
      trackerId: 'TRK-9821'
    },
    {
      id: '2',
      title: 'Carton of Children\'s Books',
      category: 'Books',
      quantity: '40 books',
      quantityNum: 40,
      location: 'Whitefield Main Rd',
      geoLocation: { lat: 12.9698, lng: 77.7499 },
      urgency: 'Low',
      description: 'Story books for ages 5-10.',
      status: 'Pending',
      donorName: 'Residents Association',
      contactPhone: '9988776655',
      createdAt: Date.now() - 86400000,
      images: []
    }
  ]);

  // Mock NGOs data with geoLocation
  const [ngos] = useState<NGO[]>([
    {
      id: 'ngo-1',
      name: 'Madiwala Shelter Home',
      description: 'Providing shelter and food for homeless people',
      rating: 4.8,
      donationsReceived: 1250,
      reviews: 89,
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=100',
      geoLocation: { lat: 12.925000, lng: 77.610000, address: 'Madiwala, Bangalore' },
      category: 'Food'
    },
    {
      id: 'ngo-2',
      name: 'Goonj Foundation',
      description: 'Clothing and essential distribution',
      rating: 4.6,
      donationsReceived: 3400,
      reviews: 156,
      image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=100',
      geoLocation: { lat: 12.9560, lng: 77.6450, address: 'Koramangala, Bangalore' },
      category: 'Clothes'
    },
    {
      id: 'ngo-3',
      name: 'Akshay Patra Foundation',
      description: 'Mid-day meal program for schools',
      rating: 4.9,
      donationsReceived: 5000,
      reviews: 320,
      image: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=100',
      geoLocation: { lat: 12.9162, lng: 77.6100, address: 'HSR Layout, Bangalore' },
      category: 'Food'
    },
    {
      id: 'ngo-4',
      name: 'Pratham Books Trust',
      description: 'Education for underprivileged children',
      rating: 4.7,
      donationsReceived: 890,
      reviews: 45,
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100',
      geoLocation: { lat: 12.9450, lng: 77.7000, address: 'Whitefield, Bangalore' },
      category: 'Books'
    }
  ]);

  // Mock Requesters (Receivers with active requests)
  const [requesters] = useState<Requester[]>([
    {
      id: 'req-1',
      name: 'Rajesh Kumar',
      organizationName: 'Orphanage Care Home',
      role: 'receiver',
      geoLocation: { lat: 12.9180, lng: 77.6250, address: 'BTM Layout, Bangalore' },
      category: 'Food',
      quantityNeeded: 100,
      urgency: 'Critical',
      description: 'Need food for 100 children at orphanage',
      status: 'Active'
    },
    {
      id: 'req-2',
      name: 'Priya Sharma',
      organizationName: 'Women Shelter',
      role: 'receiver',
      geoLocation: { lat: 12.9400, lng: 77.6600, address: 'Ejipura, Bangalore' },
      category: 'Clothes',
      quantityNeeded: 50,
      urgency: 'High',
      description: 'Winter clothes needed for women and children',
      status: 'Active'
    },
    {
      id: 'req-3',
      name: 'Mahatma Foundation',
      role: 'ngo',
      geoLocation: { lat: 12.9600, lng: 77.7200, address: 'Marathahalli, Bangalore' },
      category: 'Books',
      quantityNeeded: 200,
      urgency: 'Medium',
      description: 'Setting up library for slum area children',
      status: 'Active'
    },
    {
      id: 'req-4',
      name: 'Sunita Devi',
      role: 'receiver',
      geoLocation: { lat: 12.9100, lng: 77.5900, address: 'Shanthi Nagar, Bangalore' },
      category: 'Medical',
      quantityNeeded: 10,
      urgency: 'Critical',
      description: 'First aid supplies needed for community health camp',
      status: 'Active'
    }
  ]);

  // --- AUTOMATION 1: Smart Food Expiry Detection ---
  useEffect(() => {
    const checkExpiry = () => {
        const today = new Date().toISOString().split('T')[0];
        const expiringSoon = donations.filter(d => 
            d.category === 'Food' && 
            d.status === 'Pending' && 
            d.expiryDate && 
            d.expiryDate <= today
        );

        if (expiringSoon.length > 0) {
            setNotification({
                message: `⚠️ AUTOMATION: ${expiringSoon.length} items are expiring today! Priority raised.`,
                type: 'info'
            });
            // Auto-update urgency to Critical
            setDonations(prev => prev.map(d => 
                (d.category === 'Food' && d.expiryDate && d.expiryDate <= today) 
                ? { ...d, urgency: 'Critical' } 
                : d
            ));
        }
    };
    
    // Run on load and periodically
    checkExpiry();
    const interval = setInterval(checkExpiry, 60000 * 5); // Every 5 mins
    return () => clearInterval(interval);
  }, [donations.length]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setView(event.state.view);
        if (event.state.view !== 'category-view') setSelectedCategory(null);
      } else {
        setView('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (newView: string) => {
    if (view === newView) return;
    window.history.pushState({ view: newView }, '', '');
    setView(newView);
    if (newView !== 'category-view') setSelectedCategory(null);
  };

  useEffect(() => {
    if (user?.role === 'donor') {
        const myDonations = donations.filter(d => d.donorName === 'You' || d.donorId === user.id);
        const totalItems = myDonations.reduce((acc, curr) => acc + (curr.quantityNum || 1), 0);
        setUserStats({
            donationsCount: myDonations.length,
            livesImpacted: totalItems, 
            wasteDivertedKg: totalItems * 0.5,
            badges: myDonations.length > 5 ? ['New Comer', 'Super Donor'] : ['New Comer']
        });
    } else if (user?.role === 'ngo') {
        setUserStats({
            donationsCount: 1200,
            livesImpacted: 5000,
            wasteDivertedKg: 2500,
            badges: ['Verified NGO', 'Top Partner']
        });
    }
  }, [donations, user]);

  const handleLogin = (loggedInUser: User, isNewUser?: boolean) => {
    setUser(loggedInUser);
    window.history.replaceState({ view: 'home' }, '', '');
    setView('home');
    if (isNewUser) setShowOnboarding(true);
  };

  const handleLogout = () => {
    setUser(null);
    setView('home');
    setShowOnboarding(false);
    setActiveTask(null);
  };

  const handleDonationSubmit = (donation: DonationItem) => {
    const enrichedDonation = { ...donation, donorId: user?.id, donorName: user?.name || 'You' };
    setDonations([enrichedDonation, ...donations]);
    setNotification({ message: `New Donation Posted: ${donation.title} nearby!`, type: 'success' });
    setTimeout(() => setNotification(null), 5000);
    alert("Thank you! Your donation has been listed.");
    navigateTo('dashboard');
  };

  const handleVolunteerAccept = (item: DonationItem) => {
      const trackerId = `TRK-${Math.floor(1000 + Math.random() * 9000)}`;
      const updatedItem: DonationItem = { 
          ...item, 
          status: 'Picked Up', 
          trackerId, 
          volunteerId: user?.id,
          volunteerPhone: user?.phone || '9999988888'
      };
      
      const updatedList = donations.map(d => d.id === item.id ? updatedItem : d);
      setDonations(updatedList);
      setActiveTask(updatedItem);
      navigateTo('map');
      setNotification({ message: `Task Accepted! Tracker ID: ${trackerId}`, type: "success" });
      setTimeout(() => setNotification(null), 4000);
  };

  const handleVolunteerCancel = (item: DonationItem) => {
      const updatedItem: DonationItem = { 
          ...item, 
          status: 'Matched', 
          volunteerId: undefined, 
          trackerId: undefined,
          volunteerPhone: undefined
      };
      const updatedList = donations.map(d => d.id === item.id ? updatedItem : d);
      setDonations(updatedList);
      if (activeTask?.id === item.id) setActiveTask(null);
      alert("Task cancelled. It has been reassigned to the pool for other volunteers.");
  };

  // --- AUTOMATION 2 & 3: Auto-Matching & Auto-Assignment ---
  const handleRequestSubmit = (request: any) => {
      const matchIndex = donations.findIndex(d => 
          d.status === 'Pending' && 
          d.category === request.category && 
          (d.quantityNum || 0) >= request.quantity
      );

      if (matchIndex !== -1) {
          const matchedItem = donations[matchIndex];
          const newTrackerId = `AUTO-${Math.floor(1000 + Math.random() * 9000)}`;
          
          const autoVolunteerId = 'vol-auto-99'; 

          const updatedDonation: DonationItem = {
              ...matchedItem,
              status: 'Matched',
              receiverId: user?.id,
              receiverLocation: request.location,
              trackerId: newTrackerId,
              volunteerId: autoVolunteerId, 
              volunteerPhone: '9876500000'
          };

          const newDonations = [...donations];
          newDonations[matchIndex] = updatedDonation;
          setDonations(newDonations);

          setNotification({
              message: `⚡ AI AUTO-MATCHED: Your request was instantly linked to "${matchedItem.title}"! Volunteer assigned.`,
              type: 'success'
          });

          if (user?.role === 'receiver') {
              navigateTo('volunteer'); 
          }

      } else {
          alert("Request broadcasted! We will notify you when a donor matches.");
      }
  };

  const getFilteredDonations = () => {
    if (!selectedCategory) return donations;
    return donations.filter(d => d.category === selectedCategory);
  };

  const Hero = () => (
    <div className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">{t.heroTitle}</span>{' '}
                <span className="block text-brand-600 xl:inline">{t.heroHighlight}</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                {t.heroSubtitle}
                {user && <span className="block mt-2 font-medium text-black">{t.welcome}, {user.name}!</span>}
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                {user?.role === 'donor' && (
                  <div className="rounded-md shadow">
                    <button onClick={() => navigateTo('donate')} className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-md text-black bg-brand-500 hover:bg-brand-600 md:py-4 md:text-lg">
                      {t.donateNow}
                    </button>
                  </div>
                )}
                {(user?.role === 'volunteer' || user?.role === 'ngo') && (
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <button onClick={() => navigateTo('volunteer')} className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-md text-black bg-brand-100 hover:bg-brand-200 md:py-4 md:text-lg">
                      {t.volunteerFeed}
                    </button>
                  </div>
                )}
                 <div className="mt-3 sm:mt-0 sm:ml-3">
                    <button onClick={() => navigateTo('map')} className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg">
                      {t.viewMap}
                    </button>
                  </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return <Auth onLogin={handleLogin} language={language} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      {notification && (
        <NotificationToast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}
      {showOnboarding && <OnboardingTour role={user.role} onComplete={() => setShowOnboarding(false)} />}

      <Header currentRole={user.role} setRole={(role) => setUser({...user, role})} setView={navigateTo} currentView={view} onLogout={handleLogout} language={language} setLanguage={setLanguage} />

      <main>
        {view === 'home' && (
            <>
                <Hero />
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.browseCategories}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['Food', 'Clothes', 'Books'].map((cat) => (
                            <button key={cat} onClick={() => { setSelectedCategory(cat as Category); navigateTo('category-view'); }} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition-all text-left group">
                                <h3 className="text-xl font-bold text-gray-800 group-hover:text-brand-700">{cat}</h3>
                                <p className="text-sm text-gray-500 mt-2">{t.findOrDonate} {cat.toLowerCase()} {t.inYourArea}</p>
                                <div className="mt-4 flex items-center text-brand-600 font-medium text-sm">
                                    {t.browseListings} <ArrowRight size={16} className="ml-1" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </>
        )}
        
        {view === 'donate' && (
          <div className="py-10 animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
              <h1 className="text-3xl font-bold text-gray-900">{t.shareAbundance}</h1>
              <p className="mt-1 text-gray-500">{t.listItemsDesc}</p>
            </div>
            <DonationForm onSubmit={handleDonationSubmit} language={language} />
          </div>
        )}

        {user.role === 'receiver' && view === 'volunteer' && (
             <div className="py-10 animate-fade-in">
                <ReceiverFeed 
                    donations={donations} 
                    userId={user.id}
                    onClaim={(item) => {
                        const updated = donations.map(d => d.id === item.id ? {
                            ...d, 
                            status: 'Matched' as const, 
                            receiverId: user.id,
                            receiverLocation: user.location || { lat: 12.9250, lng: 77.6100, address: "My Location" }
                        } : d);
                        setDonations(updated);
                        alert(`You have claimed ${item.title}. A volunteer will be assigned shortly.`);
                    }}
                    onRequestSubmit={handleRequestSubmit}
                />
             </div>
        )}

        {(user.role === 'volunteer' || user.role === 'ngo') && view === 'volunteer' && (
          <div className="py-10 animate-fade-in">
             <VolunteerFeed donations={donations} onAccept={handleVolunteerAccept} onCancel={handleVolunteerCancel} />
          </div>
        )}

        {view === 'category-view' && (
           <div className="py-10 animate-fade-in">
               <div className="max-w-4xl mx-auto px-4 mb-6">
                   <button onClick={() => navigateTo('home')} className="text-sm text-gray-500 hover:underline mb-2">← {t.backHome}</button>
                   <h1 className="text-3xl font-bold text-gray-900">{selectedCategory} {t.listings}</h1>
               </div>
               <VolunteerFeed donations={getFilteredDonations()} onAccept={handleVolunteerAccept} />
           </div>
        )}

{view === 'map' && (
            <div className="py-10 max-w-7xl mx-auto px-4">
                <MapView 
                  donations={donations} 
                  activeDelivery={activeTask}
                  ngos={ngos}
                  requesters={requesters}
                />
            </div>
        )}

        {view === 'dashboard' && (
          <div className="py-10 animate-fade-in">
            <ImpactDashboard currentUser={user} stats={userStats} />
          </div>
        )}
      </main>
      <ChatBot />
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
           <div className="flex items-center md:order-2 space-x-4">
              {user.avatarUrl && <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />}
              <span className="text-sm text-gray-500">Logged in as {user.name} ({user.role})</span>
              <button onClick={handleLogout} className="flex items-center text-red-600 hover:text-red-700 text-sm font-medium">
                  <LogOut size={16} className="mr-1" /> {t.logout}
              </button>
           </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">&copy; 2024 DONUM Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
