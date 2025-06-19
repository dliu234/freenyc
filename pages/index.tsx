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

  // Parse markdown content to extract events
  useEffect(() => {
    const parseEvents = () => {
      // Use a simpler regex pattern that's compatible with older ES versions
      const eventPattern = /- 🎉 \*\*(.*?)\*\*\s*📍 (.*?)\s*🕒 (.*?)\s*📝 (.*?)\s*🔗 \[Link\]\((.*?)\)/g;
      const eventMatches = content.match(eventPattern);
      
      if (eventMatches) {
        const parsedEvents = eventMatches.map(match => {
          // Use a more specific match for each event
          const parts = match.match(/- 🎉 \*\*(.*?)\*\*\s*📍 (.*?)\s*🕒 (.*?)\s*📝 (.*?)\s*🔗 \[Link\]\((.*?)\)/);
          if (parts) {
            return {
              title: parts[1].trim(),
              location: parts[2].trim(),
              time: parts[3].trim(),
              description: parts[4].trim(),
              link: parts[5].trim(),
              category: categorizeEvent(parts[1], parts[4])
            };
          }
          return null;
        }).filter(Boolean) as Event[];
        
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
    { id: 'all', label: 'All Events', icon: '⭐', color: 'bg-purple-500' },
    { id: 'music', label: 'Music', icon: '🎵', color: 'bg-red-500' },
    { id: 'art', label: 'Art & Culture', icon: '🎨', color: 'bg-pink-500' },
    { id: 'food', label: 'Food & Drink', icon: '☕', color: 'bg-orange-500' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎭', color: 'bg-blue-500' },
    { id: 'outdoor', label: 'Outdoor', icon: '🌳', color: 'bg-green-500' },
    { id: 'education', label: 'Education', icon: '📚', color: 'bg-indigo-500' },
    { id: 'other', label: 'Other', icon: '✨', color: 'bg-gray-500' }
  ];

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return events.length;
    return events.filter(event => event.category === categoryId).length;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading NYC events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              🗽 NYC Free Events
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100">
              Discover amazing free events happening in New York City today
            </p>
            <div className="text-sm text-purple-200">
              Powered by <span className="font-semibold">TheSkint</span> • Updated daily
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 backdrop-blur-lg bg-opacity-90">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder="Search events, locations, or descriptions..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-64">
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔽</span>
                <select
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white appearance-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.label} ({getCategoryCount(category.id)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            {categories.map(category => {
              const count = getCategoryCount(category.id);
              const isActive = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                    isActive 
                      ? `${category.color} text-white shadow-lg transform scale-105` 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white bg-opacity-20' : 'bg-white'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => {
              const category = categories.find(cat => cat.id === event.category) || categories[0];
              
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-2"
                >
                  {/* Category Header */}
                  <div className={`${category.color} p-4 text-white`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <span className="font-semibold text-sm uppercase tracking-wide">
                        {category.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Event Title */}
                    <h3 className="text-xl font-bold text-gray-800 mb-4 line-clamp-2 group-hover:text-purple-600 transition-colors">
                      {event.title}
                    </h3>

                    {/* Event Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3 text-gray-600">
                        <span className="text-red-500 text-lg mt-0.5">📍</span>
                        <span className="text-sm line-clamp-2">{event.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-gray-600">
                        <span className="text-blue-500 text-lg">🕒</span>
                        <span className="text-sm">{event.time}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm line-clamp-3 mb-6 leading-relaxed">
                      {event.description}
                    </p>

                    {/* CTA Button */}
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                    >
                      <span>Learn More</span>
                      <span className="text-lg">🔗</span>
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-600 mb-2">No events found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search criteria or filters'
                  : 'No events available right now. Check back later!'
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 py-8 border-t border-gray-200">
          <p className="text-gray-600 mb-2">
            Data sourced from <a href="https://theskint.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline font-semibold">TheSkint</a>
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()} • 
            Found {events.length} free events in NYC
          </p>
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
