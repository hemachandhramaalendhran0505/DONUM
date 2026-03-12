
import React, { useState, useRef } from 'react';
import { User, Role, GeoLocation, Language } from '../types';
import { Lock, Mail, Phone, User as UserIcon, Camera, Smartphone, Chrome, Heart, Truck, Hand, AlertCircle, MapPin, Loader2, CheckCircle2, Facebook, Building2 } from 'lucide-react';
import { translations } from '../i18n/translations';

interface AuthProps {
  onLogin: (user: User, isNewUser?: boolean) => void;
  language: Language;
}

const Auth: React.FC<AuthProps> = ({ onLogin, language }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [method, setMethod] = useState<'email' | 'phone'>('phone');
  const t = translations[language];
  
  // Form State
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [ngoId, setNgoId] = useState(''); // New NGO ID field
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('donor');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Location State
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation Logic
  const validateInput = () => {
    setError(null);
    if (!identifier) return `${method === 'phone' ? 'Phone' : 'Email'} is required.`;

    if (method === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) return "Please enter a valid email address.";
    } else {
      const phoneRegex = /^\+?[1-9]\d{9,14}$/; // Basic E.164 or 10-digit
      if (!phoneRegex.test(identifier.replace(/\s/g, ''))) return "Please enter a valid phone number (10-15 digits).";
    }

    if (selectedRole === 'ngo' && !ngoId) {
        return "Government NGO ID is required for verification.";
    }

    if (!isLogin) {
        if (!name) return "Name is required for sign up.";
        if (!location && !manualAddress.trim()) return "Location is required. Please detect or enter manually.";
    }

    return null;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB validation
        setError("Image size should be less than 2MB");
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const detectLocation = () => {
    setLocationStatus('loading');
    setError(null);
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Please enter manually.");
      setLocationStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: "Detected Location" 
        });
        setLocationStatus('success');
      },
      (err) => {
        let errorMsg = "Unknown Error";
        switch(err.code) {
            case 1: errorMsg = "Permission Denied"; break;
            case 2: errorMsg = "Position Unavailable"; break;
            case 3: errorMsg = "Timeout"; break;
        }
        console.warn(`Geolocation Error: ${errorMsg} (${err.message})`);
        setError("Location access denied. Please enter address manually.");
        setLocationStatus('error');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsLoading(true);
    // Simulate Firebase SMS sending
    setTimeout(() => {
      setIsLoading(false);
      setShowOtp(true);
      setError(null);
      alert(`[Firebase Simulator] SMS sent to ${identifier}. Your OTP is 1234.`);
    }, 1500);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.length !== 4 || isNaN(Number(otp))) {
      setError('Please enter a valid 4-digit OTP.');
      return;
    }
    if (otp !== '1234') {
      setError('Invalid OTP. Try 1234.');
      return;
    }

    setIsLoading(true);
    // Simulate API Verification
    setTimeout(() => {
      // Determine final location
      const finalLocation = location || { lat: 12.9716, lng: 77.5946, address: manualAddress };

      const mockUser: User = {
        id: Math.random().toString(36),
        name: name || (method === 'email' ? identifier.split('@')[0] : 'User'),
        role: selectedRole,
        [method]: identifier,
        isVerified: true,
        ngoId: selectedRole === 'ngo' ? ngoId : undefined,
        avatarUrl: avatarPreview || undefined,
        location: finalLocation
      };
      onLogin(mockUser, !isLogin); // Pass true if it was a signup flow
    }, 1000);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
       const mockUser: User = {
        id: 'google-123',
        name: 'Google User',
        email: 'user@gmail.com',
        role: selectedRole,
        isVerified: true,
        avatarUrl: 'https://ui-avatars.com/api/?name=GU&background=random',
        location: { lat: 12.9716, lng: 77.5946 }
      };
      onLogin(mockUser, false); 
    }, 1500);
  };

  const handleFacebookLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
       const mockUser: User = {
        id: 'fb-123',
        name: 'Facebook User',
        email: 'user@facebook.com',
        role: selectedRole,
        isVerified: true,
        avatarUrl: 'https://ui-avatars.com/api/?name=FU&background=random',
        location: { lat: 12.9716, lng: 77.5946 }
      };
      onLogin(mockUser, false); 
    }, 1500);
  };

  const roles: {id: Role, label: string, icon: any}[] = [
    { id: 'donor', label: t.donor, icon: Heart },
    { id: 'receiver', label: t.receiver, icon: Hand },
    { id: 'volunteer', label: t.volunteer, icon: Truck },
    { id: 'ngo', label: 'NGO', icon: Building2 }, // Added NGO option
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
            <div className="bg-black p-4 rounded-xl shadow-lg border-2 border-brand-500">
                 <Lock className="text-brand-500 w-8 h-8" />
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? t.signInTitle : t.joinTitle}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t.tagline}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
          
          {/* Method Toggles */}
          <div className="flex border-b border-gray-200 mb-6">
             <button
                className={`flex-1 pb-4 text-sm font-medium text-center ${method === 'phone' ? 'text-black border-b-2 border-brand-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => { setMethod('phone'); setShowOtp(false); setError(null); }}
             >
                <div className="flex items-center justify-center space-x-2">
                    <Smartphone size={18} />
                    <span>{t.mobile}</span>
                </div>
             </button>
             <button
                className={`flex-1 pb-4 text-sm font-medium text-center ${method === 'email' ? 'text-black border-b-2 border-brand-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => { setMethod('email'); setShowOtp(false); setError(null); }}
             >
                <div className="flex items-center justify-center space-x-2">
                    <Mail size={18} />
                    <span>{t.email}</span>
                </div>
             </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-center">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}

          {!showOtp ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.iam}</label>
                <div className="grid grid-cols-4 gap-2">
                    {roles.map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() => setSelectedRole(r.id)}
                            className={`flex flex-col items-center justify-center p-2 border rounded-lg text-xs font-medium transition-all ${
                                selectedRole === r.id 
                                    ? 'bg-brand-50 border-brand-500 text-black ring-1 ring-brand-500' 
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <r.icon size={18} className="mb-1" />
                            {r.label}
                        </button>
                    ))}
                </div>
              </div>

              {!isLogin && (
                  <div className="animate-fade-in space-y-4">
                    {/* Profile Picture Upload */}
                    <div className="flex flex-col items-center justify-center">
                        <div 
                          className="relative w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-brand-500 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="text-gray-400" size={32} />
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Upload Profile Photo</p>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleAvatarChange} 
                            className="hidden" 
                            accept="image/*"
                        />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t.fullName}</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <UserIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-3 border"
                              placeholder="John Doe"
                          />
                      </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.location}</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={detectLocation}
                                disabled={locationStatus === 'loading' || locationStatus === 'success'}
                                className={`flex-1 flex items-center justify-center p-2 border rounded-lg text-sm font-medium transition-colors ${
                                    locationStatus === 'success' 
                                    ? 'bg-green-50 border-green-500 text-green-700' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {locationStatus === 'loading' ? (
                                    <Loader2 className="animate-spin mr-2" size={16} />
                                ) : locationStatus === 'success' ? (
                                    <CheckCircle2 className="mr-2" size={16} />
                                ) : (
                                    <MapPin className="mr-2" size={16} />
                                )}
                                {locationStatus === 'success' ? t.locationVerified : t.detectLocation}
                            </button>
                        </div>
                        {/* Fallback Manual Input */}
                        {(locationStatus === 'error' || (manualAddress && locationStatus !== 'success')) && (
                             <input
                                type="text"
                                placeholder="Enter city or address manually"
                                value={manualAddress}
                                onChange={(e) => setManualAddress(e.target.value)}
                                className="mt-2 block w-full sm:text-sm border-gray-300 rounded-lg p-2 border focus:ring-brand-500 focus:border-brand-500 animate-fade-in"
                            />
                        )}
                        <p className="text-xs text-gray-400 mt-1">We need your location to show relevant donation tasks.</p>
                    </div>
                  </div>
              )}

              {/* NGO ID Input */}
              {selectedRole === 'ngo' && (
                  <div className="animate-fade-in">
                      <label className="block text-sm font-medium text-gray-700">Government NGO ID</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Building2 className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                              type="text"
                              required
                              value={ngoId}
                              onChange={(e) => setNgoId(e.target.value)}
                              className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-3 border"
                              placeholder="NGO-XXXX-XXXX"
                          />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Official ID is required for NGO verification.</p>
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                    {method === 'phone' ? t.mobile : t.email}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {method === 'phone' ? <Phone className="h-5 w-5 text-gray-400" /> : <Mail className="h-5 w-5 text-gray-400" />}
                    </div>
                    <input
                        type={method === 'phone' ? 'tel' : 'email'}
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-3 border"
                        placeholder={method === 'phone' ? '9876543210' : 'you@example.com'}
                    />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-black bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Sending...' : t.sendOtp}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6 animate-fade-in">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <Smartphone className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Enter OTP</h3>
                    <p className="text-sm text-gray-500">We sent a code to {identifier}</p>
                </div>

                <div>
                    <label className="sr-only">OTP</label>
                    <input
                        type="text"
                        required
                        maxLength={4}
                        value={otp}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*$/.test(val)) setOtp(val);
                        }}
                        className="block w-full text-center text-2xl tracking-widest border-gray-300 rounded-lg p-3 border focus:ring-brand-500 focus:border-brand-500"
                        placeholder="••••"
                    />
                    <p className="text-xs text-center text-gray-400 mt-2">Use code 1234 for demo</p>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-black bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? 'Verifying...' : t.verify}
                </button>
                
                <button 
                    type="button"
                    onClick={() => { setShowOtp(false); setOtp(''); }}
                    className="w-full text-center text-sm text-gray-600 hover:text-brand-600"
                >
                    Change {method === 'phone' ? 'Number' : 'Email'}
                </button>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t.orContinue}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                    <Chrome className="h-5 w-5 text-gray-400 mr-2" />
                    <span>Google</span>
                </button>
                <button
                    onClick={handleFacebookLogin}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                    <Facebook className="h-5 w-5 text-blue-600 mr-2" />
                    <span>Facebook</span>
                </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
            <button
                onClick={() => {
                    setIsLogin(!isLogin);
                    setShowOtp(false);
                    setError(null);
                    setOtp('');
                    setLocation(null);
                    setManualAddress('');
                    setLocationStatus('idle');
                    setNgoId('');
                }} 
                className="text-sm font-medium text-brand-700 hover:text-brand-600"
            >
                {isLogin ? t.dontHaveAccount : t.alreadyHaveAccount}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
