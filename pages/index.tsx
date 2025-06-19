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
      // Use a simpler approach to parse events
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
    { id: 'all', label: 'All Events', icon: '✨', color: 'from-violet-500 to-purple-600', bgColor: 'bg-violet-50', textColor: 'text-violet-700' },
    { id: 'music', label: 'Music', icon: '🎵', color: 'from-red-500 to-pink-600', bgColor: 'bg-red-50', textColor: 'text-red-700' },
    { id: 'art', label: 'Art & Culture', icon: '🎨', color: 'from-pink-500 to-rose-600', bgColor: 'bg-pink-50', textColor: 'text-pink-700' },
    { id: 'food', label: 'Food & Drink', icon: '🍴', color: 'from-orange-500 to-amber-600', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎭', color: 'from-blue-500 to-indigo-600', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { id: 'outdoor', label: 'Outdoor', icon: '🌳', color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-50', textColor: 'text-green-700' },
    { id: 'education', label: 'Education', icon: '📚', color: 'from-indigo-500 to-blue-600', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
    { id: 'other', label: 'Other', icon: '🎪', color: 'from-gray-500 to-slate-600', bgColor: 'bg-gray-50', textColor: 'text-gray-700' }
  ];

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return events.length;
    return events.filter(event => event.category === categoryId).length;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-pink-500 rounded-full animate-ping mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Discovering NYC Events</h2>
          <p className="text-purple-200">Finding the best free events in the city...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-indigo-600/20 backdrop-blur-sm"></div>
        <div className="relative container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 mb-8 border border-white/20">
              <span className="text-2xl">🗽</span>
              <span className="text-white font-medium">Live • {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                FREE NYC
              </span>
              <br />
              <span className="text-white">EVENTS</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-purple-100 mb-8 leading-relaxed">
              Discover <span className="text-yellow-400 font-semibold">{events.length}</span> amazing free events 
              happening across the five boroughs today
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-purple-200">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <span>⚡</span>
                <span>Updated Daily</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <span>🎯</span>
                <span>Curated by TheSkint</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <span>💯</span>
                <span>100% Free</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-6 pb-20">
        {/* Search and Filter Section */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 mb-12 border border-white/20 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-2xl">🔍</span>
                  <input
                    type="text"
                    placeholder="Search events, locations, or descriptions..."
                    className="w-full pl-16 pr-6 py-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 text-white placeholder-purple-200 text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="lg:w-64 flex items-center justify-center lg:justify-end">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{filteredEvents.length}</div>
                <div className="text-purple-200 text-sm">Events Found</div>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map(category => {
              const count = getCategoryCount(category.id);
              const isActive = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`relative group p-4 rounded-2xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20 scale-105 shadow-lg' 
                      : 'bg-white/5 hover:bg-white/10 hover:scale-102'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${category.color} rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                  <div className="relative text-center">
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <div className={`text-sm font-medium mb-1 ${isActive ? 'text-white' : 'text-purple-100'}`}>
                      {category.label}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-purple-200'
                    }`}>
                      {count}
                    </div>
                  </div>
                </button>
              );
            })}
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
                >
                  {/* Card glow effect */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${category.color} rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-300`}></div>
                  
                  <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 group-hover:-translate-y-2">
                    {/* Category Header */}
                    <div className={`bg-gradient-to-r ${category.color} p-6 text-white relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                      <div className="relative flex items-center gap-4">
                        <span className="text-4xl">{category.icon}</span>
                        <div>
                          <div className="font-bold text-lg uppercase tracking-wider">
                            {category.label}
                          </div>
                          <div className="text-white/80 text-sm">
                            Free Event
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Event Title */}
                      <h3 className="text-2xl font-bold text-white mb-4 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                        {event.title}
                      </h3>

                      {/* Event Details */}
                      <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-4 text-purple-100">
                          <span className="text-2xl mt-1 flex-shrink-0">📍</span>
                          <div>
                            <div className="font-medium text-white mb-1">Location</div>
                            <div className="text-sm line-clamp-2">{event.location}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-purple-100">
                          <span className="text-2xl flex-shrink-0">🕒</span>
                          <div>
                            <div className="font-medium text-white mb-1">Time</div>
                            <div className="text-sm">{event.time}</div>
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
                        className={`relative group/btn overflow-hidden bg-gradient-to-r ${category.color} text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-3`}
                      >
                        <span className="relative z-10">Get Details</span>
                        <span className="relative z-10 text-2xl">🎟️</span>
                        <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300"></div>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20">
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-3xl font-bold text-white mb-4">No events found</h3>
              <p className="text-xl text-purple-200 mb-8">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or browse different categories'
                  : 'No events available right now. Check back later!'
                }
              </p>
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-20 pt-12 border-t border-white/20">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <p className="text-purple-100 text-lg mb-4">
              Data curated with ❤️ from{' '}
              <a 
                href="https://theskint.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-transparent bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text font-bold hover:from-yellow-300 hover:to-pink-300 transition-all duration-300"
              >
                TheSkint
              </a>
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-purple-200">
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span>Updated: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🎯</span>
                <span>{events.length} Free Events</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🌆</span>
                <span>All 5 Boroughs</span>
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
