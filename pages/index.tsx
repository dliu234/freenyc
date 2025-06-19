import fs from 'fs';
import path from 'path';
import { useState, useEffect } from 'react';

interface Event {
  title: string;
  location: string;
  time: string;
  description: string;
  link: string;
  category?: string;
}

interface HomeProps {
  content: string;
}

export default function Home({ content }: HomeProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Parse markdown content to extract events
  useEffect(() => {
    const parseEvents = () => {
      const eventPattern = /- 🎉 \*\*(.*?)\*\*\s*📍 (.*?)\s*🕒 (.*?)\s*📝 (.*?)\s*🔗 \[Link\]\((.*?)\)/g;
      const matches = [];
      let match;
      
      while ((match = eventPattern.exec(content)) !== null) {
        matches.push(match);
      }
      
      if (matches.length > 0) {
        const parsedEvents = matches.map(match => {
          return {
            title: match[1].trim(),
            location: match[2].trim(),
            time: match[3].trim(),
            description: match[4].trim(),
            link: match[5].trim(),
            category: categorizeEvent(match[1], match[4])
          };
        });
        
        setEvents(parsedEvents);
        setFilteredEvents(parsedEvents);
      }
      setIsLoaded(true);
    };

    parseEvents();
  }, [content]);

  // Categorize events based on title and description
  const categorizeEvent = (title: string, description: string): string => {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('music') || text.includes('concert') || text.includes('jazz') || text.includes('band')) return 'music';
    if (text.includes('art') || text.includes('museum') || text.includes('gallery') || text.includes('exhibition')) return 'art';
    if (text.includes('food') || text.includes('festival') || text.includes('market') || text.includes('restaurant')) return 'food';
    if (text.includes('comedy') || text.includes('theater') || text.includes('performance') || text.includes('show')) return 'entertainment';
    if (text.includes('outdoor') || text.includes('park') || text.includes('garden') || text.includes('nature')) return 'outdoor';
    if (text.includes('workshop') || text.includes('class') || text.includes('learn') || text.includes('education')) return 'education';
    
    return 'other';
  };

  // Filter events based on search and category
  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    setFilteredEvents(filtered);
  }, [searchTerm, selectedCategory, events]);

  const categories = [
    { 
      id: 'all', 
      label: 'All Events', 
      icon: '✨', 
      gradient: 'bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600',
      shadow: 'shadow-violet-500/50',
      ring: 'ring-violet-400',
      glow: 'drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]'
    },
    { 
      id: 'music', 
      label: 'Music', 
      icon: '🎵', 
      gradient: 'bg-gradient-to-br from-red-500 via-pink-500 to-rose-600',
      shadow: 'shadow-red-500/50',
      ring: 'ring-red-400',
      glow: 'drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]'
    },
    { 
      id: 'art', 
      label: 'Art & Culture', 
      icon: '🎨', 
      gradient: 'bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600',
      shadow: 'shadow-pink-500/50',
      ring: 'ring-pink-400',
      glow: 'drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]'
    },
    { 
      id: 'food', 
      label: 'Food & Drink', 
      icon: '🍴', 
      gradient: 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600',
      shadow: 'shadow-orange-500/50',
      ring: 'ring-orange-400',
      glow: 'drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]'
    },
    { 
      id: 'entertainment', 
      label: 'Entertainment', 
      icon: '🎭', 
      gradient: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-600',
      shadow: 'shadow-blue-500/50',
      ring: 'ring-blue-400',
      glow: 'drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]'
    },
    { 
      id: 'outdoor', 
      label: 'Outdoor', 
      icon: '🌳', 
      gradient: 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600',
      shadow: 'shadow-green-500/50',
      ring: 'ring-green-400',
      glow: 'drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]'
    },
    { 
      id: 'education', 
      label: 'Education', 
      icon: '📚', 
      gradient: 'bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-600',
      shadow: 'shadow-indigo-500/50',
      ring: 'ring-indigo-400',
      glow: 'drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]'
    },
    { 
      id: 'other', 
      label: 'Other', 
      icon: '🎪', 
      gradient: 'bg-gradient-to-br from-gray-500 via-slate-500 to-zinc-600',
      shadow: 'shadow-gray-500/50',
      ring: 'ring-gray-400',
      glow: 'drop-shadow-[0_0_15px_rgba(107,114,128,0.5)]'
    }
  ];

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return events.length;
    return events.filter(event => event.category === categoryId).length;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative text-center">
          <div className="relative mb-8">
            {/* Outer rotating ring */}
            <div className="w-32 h-32 border-4 border-transparent border-t-purple-500 border-r-pink-500 rounded-full animate-spin mx-auto"></div>
            {/* Inner pulsing circle */}
            <div className="absolute inset-4 w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-pulse opacity-50"></div>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl animate-bounce">🗽</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Discovering NYC
            </h2>
            <p className="text-xl text-purple-300 animate-pulse">
              Finding amazing free events across the city...
            </p>
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Interactive cursor effect */}
      <div 
        className="fixed w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full pointer-events-none z-50 opacity-30 blur-sm transition-all duration-150 ease-out"
        style={{
          left: mousePosition.x - 16,
          top: mousePosition.y - 16,
        }}
      />

      {/* Animated background mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center max-w-6xl mx-auto">
            {/* Status badge */}
            <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-xl rounded-full px-8 py-4 mb-12 border border-white/10 shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 group">
              <div className="relative">
                <span className="text-3xl animate-bounce">🗽</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
              </div>
              <div className="text-white font-semibold text-lg">
                Live • {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
              <div className="text-sm text-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Updated every minute
              </div>
            </div>
            
            {/* Main title */}
            <div className="relative">
              <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tight">
                <div className="relative inline-block">
                  <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent hover:from-yellow-300 hover:to-purple-500 transition-all duration-700">
                    FREE NYC
                  </span>
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/20 via-pink-400/20 to-purple-400/20 blur-xl opacity-50"></div>
                </div>
                <br />
                <span className="text-white drop-shadow-2xl">EVENTS</span>
              </h1>
              
              {/* Subtitle with stats */}
              <p className="text-2xl md:text-3xl text-purple-100 mb-12 leading-relaxed">
                Discover{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent font-bold text-4xl">
                    {events.length}
                  </span>
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </span>
                {' '}amazing free events
                <br />
                happening across all five boroughs
              </p>
            </div>
            
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-6 text-lg">
              {[
                { icon: '⚡', text: 'Updated Daily', color: 'from-yellow-400 to-orange-500' },
                { icon: '🎯', text: 'Curated by TheSkint', color: 'from-pink-400 to-red-500' },
                { icon: '💯', text: '100% Free', color: 'from-green-400 to-emerald-500' },
                { icon: '🌆', text: 'All 5 Boroughs', color: 'from-blue-400 to-cyan-500' }
              ].map((badge, index) => (
                <div 
                  key={index}
                  className="group relative"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${badge.color} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>
                  <div className="relative flex items-center gap-3 bg-white/5 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="text-purple-100 font-medium">{badge.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-6 pb-20">
        {/* Search and Filter Section */}
        <div className="relative group mb-16">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
          
          <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex flex-col lg:flex-row gap-8 mb-10">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative group/search">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover/search:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 transform -translate-y-1/2 text-3xl group-hover/search:scale-110 transition-transform duration-200">
                      🔍
                    </div>
                    <input
                      type="text"
                      placeholder="Search events, locations, or descriptions..."
                      className="w-full pl-20 pr-8 py-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl focus:ring-4 focus:ring-purple-500/30 focus:border-white/40 transition-all duration-300 text-white placeholder-purple-200 text-xl font-medium shadow-xl"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Stats Display */}
              <div className="lg:w-80 flex items-center justify-center">
                <div className="text-center bg-white/10 backdrop-blur-xl rounded-2xl px-8 py-6 border border-white/20">
                  <div className="text-5xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
                    {filteredEvents.length}
                  </div>
                  <div className="text-purple-200 text-lg font-medium">Events Found</div>
                </div>
              </div>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {categories.map((category, index) => {
                const count = getCategoryCount(category.id);
                const isActive = selectedCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`relative group/cat p-6 rounded-2xl transition-all duration-300 transform ${
                      isActive 
                        ? 'scale-105 bg-white/15' 
                        : 'hover:scale-102 bg-white/5 hover:bg-white/10'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Background glow */}
                    <div className={`absolute inset-0 ${category.gradient} rounded-2xl opacity-0 ${
                      isActive ? 'opacity-30' : 'group-hover/cat:opacity-20'
                    } transition-opacity duration-300`}></div>
                    
                    {/* Content */}
                    <div className="relative text-center">
                      <div className={`text-4xl mb-3 transition-transform duration-200 ${
                        isActive ? category.glow : 'group-hover/cat:scale-110'
                      }`}>
                        {category.icon}
                      </div>
                      <div className={`text-sm font-bold mb-2 transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-purple-100 group-hover/cat:text-white'
                      }`}>
                        {category.label}
                      </div>
                      <div className={`text-xs px-3 py-1 rounded-full font-semibold transition-all duration-200 ${
                        isActive 
                          ? 'bg-white/30 text-white shadow-lg' 
                          : 'bg-white/10 text-purple-200 group-hover/cat:bg-white/20'
                      }`}>
                        {count}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => {
              const category = categories.find(cat => cat.id === event.category) || categories[0];
              
              return (
                <div
                  key={index}
                  className="group relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Card glow effect */}
                  <div className={`absolute -inset-1 ${category.gradient} rounded-3xl blur opacity-0 group-hover:opacity-50 transition-all duration-500`}></div>
                  
                  <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 group-hover:-translate-y-3 shadow-2xl hover:shadow-purple-500/25">
                    {/* Category Header */}
                    <div className={`${category.gradient} p-8 text-white relative overflow-hidden`}>
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 group-hover:scale-110 transition-transform duration-500"></div>
                      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-10 -translate-x-10 group-hover:scale-110 transition-transform duration-500"></div>
                      
                      <div className="relative flex items-center gap-6">
                        <div className={`text-5xl ${category.glow} group-hover:scale-110 transition-transform duration-300`}>
                          {category.icon}
                        </div>
                        <div>
                          <div className="font-black text-xl uppercase tracking-wider mb-1">
                            {category.label}
                          </div>
                          <div className="text-white/90 text-sm font-medium">
                            Free Event • NYC
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-8">
                      {/* Event Title */}
                      <h3 className="text-2xl font-bold text-white mb-6 line-clamp-2 group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                        {event.title}
                      </h3>

                      {/* Event Details */}
                      <div className="space-y-6 mb-8">
                        <div className="flex items-start gap-4">
                          <div className="text-3xl mt-1 group-hover:scale-110 transition-transform duration-200">📍</div>
                          <div className="flex-1">
                            <div className="font-bold text-white mb-2 text-lg">Location</div>
                            <div className="text-purple-100 text-sm leading-relaxed line-clamp-2">{event.location}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-3xl group-hover:scale-110 transition-transform duration-200">🕒</div>
                          <div className="flex-1">
                            <div className="font-bold text-white mb-2 text-lg">Time</div>
                            <div className="text-purple-100 text-sm">{event.time}</div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-purple-100 text-sm line-clamp-3 mb-8 leading-relaxed">
                        {event.description}
                      </p>

                      {/* CTA Button */}
                      <a
                        href={event.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`relative group/btn block overflow-hidden ${category.gradient} text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 ${category.shadow} hover:shadow-2xl text-center`}
                      >
                        <div className="relative z-10 flex items-center justify-center gap-3">
                          <span>Get Details</span>
                          <span className="text-2xl group-hover/btn:rotate-12 transition-transform duration-200">🎟️</span>
                        </div>
                        <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300"></div>
                        
                        {/* Button shine effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out"></div>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20">
              <div className="text-9xl mb-8 animate-bounce">🔍</div>
              <h3 className="text-4xl font-bold text-white mb-6">No events found</h3>
              <p className="text-2xl text-purple-200 mb-12 max-w-md mx-auto leading-relaxed">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search criteria or explore different categories'
                  : 'No events available right now. Check back later for new exciting events!'
                }
              </p>
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-purple-500/50"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-24 pt-16 border-t border-white/10">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
            
            <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl p-12 border border-white/10">
              <p className="text-2xl text-purple-100 mb-8 leading-relaxed">
                Data curated with{' '}
                <span className="text-3xl mx-2 animate-pulse">❤️</span>
                {' '}from{' '}
                <a 
                  href="https://theskint.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="relative inline-block group/link"
                >
                  <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent font-black text-3xl hover:from-yellow-300 hover:to-purple-500 transition-all duration-500">
                    TheSkint
                  </span>
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-purple-400 rounded-full transform scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300"></div>
                </a>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-lg">
                {[
                  { icon: '📅', label: 'Last Updated', value: new Date().toLocaleDateString() },
                  { icon: '🎯', label: 'Total Events', value: `${events.length} Free Events` },
                  { icon: '🌆', label: 'Coverage', value: 'All 5 Boroughs' }
                ].map((stat, index) => (
                  <div key={index} className="group/stat relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl blur opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                      <div className="text-4xl mb-3 group-hover/stat:scale-110 transition-transform duration-200">{stat.icon}</div>
                      <div className="font-bold text-white mb-1">{stat.label}</div>
                      <div className="text-purple-200 text-sm">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 pt-8 border-t border-white/10">
                <p className="text-purple-300 text-sm">
                  Made with modern web technologies • Real-time updates • Responsive design
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Keep the existing getServerSideProps function
export async function getServerSideProps() {
  const dir = path.join(process.cwd(), 'output');
  let content = "⚠️ No events available yet. Please check back later.";

  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().reverse();
    if (files.length > 0) {
      content = fs.readFileSync(path.join(dir, files[0]), 'utf8');
    }
  } catch (e) {
    console.warn("output/ directory or Markdown file not found.");
  }

  return { props: { content } };
}
