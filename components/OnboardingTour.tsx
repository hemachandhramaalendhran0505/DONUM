import React, { useState } from 'react';
import { Role } from '../types';
import { X, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

interface OnboardingTourProps {
  role: Role;
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ role, onComplete }) => {
  const [step, setStep] = useState(0);

  const getSteps = (role: Role) => {
    const commonSteps = [
      {
        title: "Welcome to DONUM!",
        desc: "You're now part of a community bridging the gap between abundance and scarcity.",
        image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=400"
      }
    ];

    const specificSteps = role === 'donor' ? [
      {
        title: "Donate Effortlessly",
        desc: "Got excess food, clothes, or books? Use the 'Donate' tab. You can even upload photos and let our AI categorize them for you!",
        image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=400"
      },
      {
        title: "Track Your Impact",
        desc: "Visit the Dashboard to see how many kgs of waste you've diverted and lives you've touched.",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400"
      }
    ] : role === 'volunteer' ? [
      {
        title: "Find Tasks Nearby",
        desc: "Check the Volunteer Feed to see donation pickups near you. We prioritize Critical urgency items.",
        image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=400"
      },
      {
        title: "Optimized Routes",
        desc: "Use our AI Route Optimizer to plan the most efficient path for multiple pickups.",
        image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=400"
      }
    ] : [
      {
        title: "Find Resources",
        desc: "Browse categories like Food and Clothes to find what you need in your vicinity.",
        image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=400"
      }
    ];

    const finalStep = [
      {
        title: "Need Help?",
        desc: "Our AI Chatbot is available 24/7 to answer questions or guide you through the app.",
        image: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&q=80&w=400"
      }
    ];

    return [...commonSteps, ...specificSteps, ...finalStep];
  };

  const steps = getSteps(role);
  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden flex flex-col relative">
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 text-white hover:text-yellow-400 z-10 bg-black/50 rounded-full p-1"
        >
          <X size={24} />
        </button>

        {/* Image Area */}
        <div className="h-48 w-full relative">
          <img 
            src={currentStep.image} 
            alt={currentStep.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-6">
            <h2 className="text-2xl font-bold text-yellow-400">{currentStep.title}</h2>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 flex flex-col">
          <p className="text-gray-600 text-lg mb-8 flex-1">
            {currentStep.desc}
          </p>

          <div className="flex items-center justify-between mt-auto">
            {/* Dots */}
            <div className="flex space-x-2">
              {steps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-2 h-2 rounded-full transition-colors ${idx === step ? 'bg-brand-500' : 'bg-gray-300'}`}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex space-x-3">
              {step > 0 && (
                <button 
                  onClick={() => setStep(step - 1)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
              )}
              
              <button 
                onClick={() => {
                  if (step < steps.length - 1) {
                    setStep(step + 1);
                  } else {
                    onComplete();
                  }
                }}
                className="bg-brand-500 hover:bg-brand-600 text-black px-6 py-2 rounded-lg font-bold transition-colors flex items-center shadow-md"
              >
                {step === steps.length - 1 ? (
                  <>Get Started <CheckCircle size={18} className="ml-2" /></>
                ) : (
                  <>Next <ArrowRight size={18} className="ml-2" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;