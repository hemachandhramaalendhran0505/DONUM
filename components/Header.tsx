import React, { useState } from 'react';
import { Heart, Package, Truck, User, Menu, X, BarChart, Map, LogOut, Globe, ChevronDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Role, Language } from '../types';
import { translations } from '../i18n/translations';

interface HeaderProps {
  currentRole: Role;
  setRole: (role: Role) => void;
  setView: (view: string) => void;
  currentView: string;
  onLogout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ currentRole, setRole, setView, currentView, onLogout, language, setLanguage }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLangOpen, setIsLangOpen] = React.useState(false);
  const t = translations[language];

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' }
  ];

  const NavItem = ({ view, icon: Icon, label }: { view: string; icon: any; label: string }) => (
    <button
      onClick={() => {
        setView(view);
        setIsMenuOpen(false);
      }}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors w-full md:w-auto text-left font-medium ${
        currentView === view
          ? 'bg-brand-500 text-black'
          : 'text-gray-300 hover:text-brand-500 hover:bg-gray-900'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left Section: Nav Arrows + Logo */}
          <div className="flex items-center gap-4">
             {/* Navigation Icons (Back / Forward) */}
             <div className="hidden md:flex items-center space-x-1 border-r border-gray-800 pr-4 mr-2">
                <button 
                  onClick={() => window.history.back()} 
                  className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-brand-500 transition-colors"
                  title="Go Back"
                >
                  <ArrowLeft size={18} />
                </button>
                <button 
                  onClick={() => window.history.forward()} 
                  className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-brand-500 transition-colors"
                  title="Go Forward"
                >
                  <ArrowRight size={18} />
                </button>
             </div>

             {/* Logo */}
             <div 
                className="flex items-center cursor-pointer group"
                onClick={() => setView('home')}
             >
                <div className="bg-brand-500 text-black p-2 rounded-lg mr-2 transition-transform group-hover:scale-105">
                <Heart size={24} fill="black" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">DONUM</span>
             </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-2 items-center">
             <NavItem view="home" icon={User} label={t.home} />
             {currentRole === 'donor' && <NavItem view="donate" icon={Package} label={t.donate} />}
             {(currentRole === 'volunteer' || currentRole === 'receiver') && <NavItem view="volunteer" icon={Truck} label={t.listings} />}
             <NavItem view="map" icon={Map} label={t.map} />
             <NavItem view="dashboard" icon={BarChart} label={t.impact} />
             
             <div className="h-6 w-px bg-gray-700 mx-2"></div>
             
             {/* Language Selector Desktop */}
             <div className="relative">
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <Globe size={18} />
                  <span className="uppercase text-sm font-bold">{language}</span>
                  <ChevronDown size={14} />
                </button>
                
                {isLangOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in border border-gray-100">
                     {languages.map((lang) => (
                        <button
                           key={lang.code}
                           onClick={() => {
                             setLanguage(lang.code);
                             setIsLangOpen(false);
                           }}
                           className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between ${
                             language === lang.code ? 'font-bold text-brand-600 bg-brand-50' : 'text-gray-700'
                           }`}
                        >
                           <span>{lang.label}</span>
                           {language === lang.code && <div className="w-2 h-2 rounded-full bg-brand-500"></div>}
                        </button>
                     ))}
                  </div>
                )}
             </div>

             <button 
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-red-500 hover:bg-red-900/20 font-medium"
             >
                <LogOut size={18} />
                <span>{t.logout}</span>
             </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
             {/* Mobile Back Button */}
            <button 
                  onClick={() => window.history.back()} 
                  className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-brand-500 transition-colors"
            >
                  <ArrowLeft size={24} />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-300 hover:text-white"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black border-b border-gray-800 py-2 shadow-lg absolute w-full z-50">
          <div className="flex flex-col space-y-1 px-4 pb-4">
            <NavItem view="home" icon={User} label={t.home} />
            {currentRole === 'donor' && <NavItem view="donate" icon={Package} label={t.donate} />}
            <NavItem view="volunteer" icon={Truck} label={t.listings} />
            <NavItem view="map" icon={Map} label={t.map} />
            <NavItem view="dashboard" icon={BarChart} label={t.impact} />
            
            <div className="border-t border-gray-800 my-2 pt-2">
                {/* Language Selector Mobile */}
                <div className="mb-2">
                    <p className="text-xs text-gray-500 px-4 mb-2 uppercase">{t.selectLanguage}</p>
                    <div className="grid grid-cols-2 gap-2 px-2">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code);
                                }}
                                className={`px-3 py-2 rounded text-sm font-medium border ${
                                    language === lang.code 
                                    ? 'bg-brand-500 text-black border-brand-500' 
                                    : 'text-gray-400 border-gray-800 hover:border-gray-600'
                                }`}
                            >
                                {lang.label.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => {
                        setIsMenuOpen(false);
                        onLogout();
                    }}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-red-500 hover:bg-red-900/20 w-full text-left font-medium mt-2"
                >
                    <LogOut size={18} />
                    <span>{t.logout}</span>
                </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;