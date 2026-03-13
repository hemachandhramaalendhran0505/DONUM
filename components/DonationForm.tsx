
import React, { useState, useRef } from 'react';
import { analyzeDonationInput } from '../services/geminiService';
import { Mic, Sparkles, MapPin, Loader2, CheckCircle, ImagePlus, X, Camera, Aperture, Phone, CheckCircle2, CalendarClock } from 'lucide-react';
import { Category, Urgency, DonationItem, Language } from '../types';
import { translations } from '../i18n/translations';

declare var google: any;
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

interface DonationFormProps {
  onSubmit: (donation: DonationItem) => void;
  language: Language;
}

const DonationForm: React.FC<DonationFormProps> = ({ onSubmit, language }) => {
  const [naturalInput, setNaturalInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const t = translations[language];

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('Low');
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setUploadedImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Voice recognition is not supported in this browser. Please try Chrome.");
        return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    if (isListening) {
        recognition.stop();
        setIsListening(false);
    } else {
        setIsListening(true);
        recognition.start();

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setNaturalInput(prev => (prev ? prev + ' ' + transcript : transcript));
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech Recognition Error", event.error);
            setIsListening(false);
        };
        
        recognition.onend = () => setIsListening(false);
    }
  };

const handleSmartAnalyze = async () => {
    if (!naturalInput.trim() && uploadedImages.length === 0) return;
    setIsAnalyzing(true);
    
    console.log('🧠 AI Analyze START - Input:', naturalInput, 'Images:', uploadedImages.length);
    
    // Pass images if any
    const result = await analyzeDonationInput(naturalInput, uploadedImages);
    
    console.log('🧠 AI Analyze RESULT:', result);
    
    if (result) {
      setTitle(result.title || '');
      setCategory(result.category as Category);
      setQuantity(result.quantity || '');
      setUrgency(result.urgency as Urgency);
      if (result.location) setLocation(result.location);
      setDescription(naturalInput || `Donation of ${result.title}`);
      
      // Auto-set Expiry logic for food
      if (result.category === 'Food') {
         // Default to today + 2 days for AI detections
         const date = new Date();
         date.setDate(date.getDate() + 2);
         setExpiryDate(date.toISOString().split('T')[0]);
      }

      // Show fallback warning if quota exceeded
      if (result.error) {
        console.warn('🤖 FALLBACK MODE: AI quota exceeded, using Smart Mock');
        // Trigger brief notification (can be enhanced with toast)
        setTimeout(() => {
          alert(`📱 Smart Mock Activated (AI quota reached)\\nCategory: ${result.category}\\nTitle: ${result.title}`);
        }, 100);
      }

      setShowForm(true);
    } else {
      console.warn('❌ No result from analyzeDonationInput');
      setShowForm(true);
    }
    setIsAnalyzing(false);
  };

  const geocodeAddress = async (address: string): Promise<{ lat: number, lng: number } | undefined> => {
      if (typeof google === 'undefined' || !google.maps || !google.maps.Geocoder) {
          console.warn("Google Maps not loaded, using mock coordinates.");
          // Randomize slightly to avoid stacking on exact same mock point
          return { lat: 12.9716 + (Math.random() * 0.01), lng: 77.5946 + (Math.random() * 0.01) }; 
      }
      const geocoder = new google.maps.Geocoder();
      try {
          const response = await geocoder.geocode({ address: address });
          if (response && response.results && response.results.length > 0) {
              const location = response.results[0].geometry.location;
              return { lat: location.lat(), lng: location.lng() };
          }
      } catch (e) {
          console.error("Geocoding failed", e);
          const offset = (address.length % 10) * 0.01;
          return { lat: 12.9716 + offset, lng: 77.5946 - offset };
      }
      return undefined;
  };

  const handleDetectLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
             const geocoder = new google.maps.Geocoder();
             geocoder.geocode({ location: { lat: latitude, lng: longitude } })
                .then((response: any) => {
                     if (response.results && response.results[0]) {
                         setLocation(response.results[0].formatted_address);
                     } else {
                         setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                     }
                     setIsLocating(false);
                })
                .catch((e: any) => {
                    setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    setIsLocating(false);
                });
        } else {
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            setIsLocating(false);
        }
      },
      (error) => {
        let errorMsg = "Unknown Error";
        switch(error.code) {
            case 1: errorMsg = "Permission Denied"; break;
            case 2: errorMsg = "Position Unavailable"; break;
            case 3: errorMsg = "Timeout"; break;
        }
        console.warn(`Geolocation Error: ${errorMsg} (${error.message})`);
        alert("Could not detect location. Using default. Please enter manually if needed.");
        setLocation("Bengaluru, Karnataka, India (Default)");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const coordinates = await geocodeAddress(location);
    const quantityNum = parseInt(quantity.replace(/[^0-9]/g, '')) || 1;

    // Automation: Check expiry vs Urgency
    let finalUrgency = urgency;
    if (expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 1) finalUrgency = 'Critical';
        else if (diffDays <= 3) finalUrgency = 'High';
    }

    const newDonation: DonationItem = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      category,
      quantity,
      quantityNum,
      location,
      geoLocation: coordinates ? { ...coordinates, address: location } : undefined,
      urgency: finalUrgency,
      expiryDate,
      status: 'Pending',
      donorName: 'You', 
      contactPhone,
      createdAt: Date.now(),
      images: uploadedImages
    };
    
    onSubmit(newDonation);
    
    setIsSubmitting(false);
    setNaturalInput('');
    setShowForm(false);
    setUploadedImages([]);
    setTitle('');
    setLocation('');
    setQuantity('');
    setContactPhone('');
    setExpiryDate('');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-black p-6 text-yellow-400">
          <h2 className="text-2xl font-bold mb-2">{t.makeDonation}</h2>
          <p className="text-gray-300">{t.uploadDesc}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Upload Photos & Describe (Optional)
            </label>
            <div className="relative">
              <textarea
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-shadow min-h-[120px]"
                placeholder="Upload photos or type details here (e.g. 'Leftover Wedding Sambar')..."
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
              />
              {uploadedImages.length > 0 && (
                <div className="flex gap-2 p-2 overflow-x-auto bg-gray-50 border-t border-gray-100">
                    {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 shrink-0 group">
                            <img src={img} alt="preview" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                            <button 
                                onClick={() => removeImage(idx)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
              )}
              <div className="absolute bottom-3 right-3 flex space-x-2">
                 <button 
                    type="button" 
                    onClick={handleMicClick} 
                    className={`p-2 rounded-lg border transition-colors ${isListening ? 'bg-red-100 text-red-600 border-red-300 animate-pulse' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'}`} 
                    title="Speak to Describe"
                 >
                    <Mic size={18} />
                 </button>
                 <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 border border-gray-300" title="Take Photo">
                    <Aperture size={18} />
                 </button>
                 <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 border border-gray-300" title="Upload from Gallery">
                    <ImagePlus size={18} />
                 </button>
                 <button type="button" onClick={handleSmartAnalyze} disabled={isAnalyzing} className="p-2 bg-brand-500 text-black rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center gap-1 font-medium" title="Analyze with AI">
                    {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    <span>{t.analyze}</span>
                 </button>
              </div>
            </div>
             <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
             <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <p>*AI detects category/urgency/quantity from text/images. <strong>Fallbacks work for ALL inputs!</strong></p>
                <button type="button" onClick={() => setShowForm(true)} className="text-brand-600 hover:underline font-bold">Enter Manually</button>
             </div>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-800 flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} /> Verified Details
                  </h3>
                  <button type="button" onClick={() => setShowForm(false)} className="text-xs text-red-500 hover:underline">Clear</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t.itemTitle}</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border" placeholder="e.g. 50 Packets of Curd Rice" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.category}</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border">
                    {['Food', 'Clothes', 'Books', 'Stationery', 'Electronics', 'Medical', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.urgency}</label>
                  <select value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border">
                    {['Low', 'Medium', 'High', 'Critical'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {category === 'Food' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expiry Date (For Auto-Alerts)</label>
                    <div className="relative mt-1">
                        <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="block w-full rounded-lg border-gray-300 shadow-sm p-2 pl-9 border" />
                        <CalendarClock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    </div>
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">{t.quantity}</label>
                <input type="text" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border" placeholder="e.g. 10 kg, 5 boxes" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <div className="relative mt-1">
                   <input type="tel" required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="block w-full rounded-lg border-gray-300 shadow-sm p-2 pl-9 border" placeholder="Enter mobile number" />
                   <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t.pickupLocation}</label>
                <div className="flex gap-2 mt-1">
                     <div className="relative flex-1">
                        <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} className="block w-full rounded-lg border-gray-300 shadow-sm p-2 pl-9 border" placeholder="Enter full address" />
                        <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    </div>
                    <button type="button" onClick={handleDetectLocation} disabled={isLocating} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg border border-gray-300 flex items-center transition-colors" title="Detect Current Location">
                        {isLocating ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                    </button>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-black bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors mt-4">
                {isSubmitting ? 'Listing...' : t.confirmListing}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationForm;
