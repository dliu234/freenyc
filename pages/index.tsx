import fs from 'fs';
import path from 'path';
import { useState, useEffect } from 'react';

interface Event {
  title: string;
  location: string;
  time: string;
  description: string;
  link: string;
  category: string;
}

interface HomeProps {
  content: string;
}

const categoryConfig = {
  'Art & Culture': { emoji: '🎨', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', count: 0 },
  'Music': { emoji: '🎵', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', count: 0 },
  'Food & Drink': { emoji: '🍽️', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', count: 0 },
  'Entertainment': { emoji: '🎪', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', count: 0 },
  'Outdoor': { emoji: '🌳', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', count: 0 },
  'Education': { emoji: '📚', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', count: 0 },
  'Other': { emoji: '🎯', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', count: 0 }
};

export default function Home({ content }: HomeProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All Events');
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
          const title = match[1].trim();
          const category = determineCategory(title, match[4].trim());
          
          return {
            title,
            location: match[2].trim(),
            time: match[3].trim(),
            description: match[4].trim(),
            link: match[5].trim(),
            category
          };
        });
        
        setEvents(parsedEvents);
        setFilteredEvents(parsedEvents);
        
        // Update category counts
        Object.keys(categoryConfig).forEach(cat => {
          categoryConfig[cat].count = parsedEvents.filter(e => e.category === cat).length;
        });
      }
      setIsLoaded(true);
    };

    parseEvents();
  }, [content]);

  const determineCategory = (title: string, description: string): string => {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('art') || text.includes('museum') || text.includes('gallery') || 
        text.includes('exhibit') || text.includes('culture') || text.includes('theater') ||
        text.includes('dance') || text.includes('film') || text.includes('movie')) {
      return 'Art & Culture';
    }
    if (text.includes('music') || text.includes('concert') || text.includes('band') ||
        text.includes('jazz') || text.includes('classical') || text.includes('acoustic') ||
        text.includes('performance') || text.includes('sing')) {
      return 'Music';
    }
    if (text.includes('food') || text.includes('drink') || text.includes('wine') ||
        text.includes('beer') || text.includes('coffee') || text.includes('restaurant') ||
        text.includes('tasting') || text.includes('cook')) {
      return 'Food & Drink';
    }
    if (text.includes('comedy') || text.includes('show') || text.includes('entertainment') ||
        text.includes('fun') || text.includes('game') || text.includes('party')) {
      return 'Entertainment';
    }
    if (text.includes('park') || text.includes('outdoor') || text.includes('garden') ||
        text.includes('nature') || text.includes('walk') || text.includes('bike') ||
        text.includes('beach') || text.includes('hiking')) {
      return 'Outdoor';
    }
    if (text.includes('learn') || text.includes('education') || text.includes('workshop') ||
        text.includes('class') || text.includes('lecture') || text.includes('seminar') ||
        text.includes('training') || text.includes('course')) {
      return 'Education';
    }
    
    return 'Other';
  };

  const filterByCategory = (category: string) => {
    setActiveCategory(category);
    if (category === 'All Events') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(event => event.category === category));
    }
  };

  if (!isLoaded) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Floating particles */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '100px',
          height: '100px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '80px',
          height: '80px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>
        
        <div style={{ 
          color: 'white', 
          textAlign: 'center',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          padding: '3rem',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.2)'
        }}>
          <div style={{ 
            fontSize: '5rem', 
            marginBottom: '2rem',
            animation: 'bounce 2s infinite'
          }}>🗽</div>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold',
            marginBottom: '1rem',
            background: 'linear-gradient(45deg, #fff, #f0f8ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Loading NYC Events...
          </h2>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
        
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 25px 50px rgba(0,0,0,0.3);
        }
        .category-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
      `}</style>
      
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 20%, #f093fb 40%, #43e97b 60%, #38f9d7 80%, #667eea 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 10s ease infinite',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background particles */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '120px',
          height: '120px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '70%',
          right: '10%',
          width: '90px',
          height: '90px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite reverse'
        }}></div>
        
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          padding: '2rem',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{ color: '#d1fae5', fontSize: '1rem', fontWeight: '500' }}>
                Live • {currentTime} • Updated every minute
              </span>
            </div>
            
            <h1 style={{ 
              fontSize: 'clamp(3rem, 8vw, 6rem)', 
              fontWeight: '900', 
              color: 'white', 
              marginBottom: '1rem',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              background: 'linear-gradient(45deg, #fff, #f0f8ff, #e6f3ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'fadeInUp 1s ease-out'
            }}>
              FREE NYC EVENTS
            </h1>
            <p style={{ 
              fontSize: '1.5rem', 
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '2rem',
              fontWeight: '300'
            }}>
              Discover {events.length} amazing free events across all five boroughs
            </p>
            <div style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(20px)',
              padding: '1rem 2rem',
              borderRadius: '50px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <span style={{ color: 'white', fontSize: '1.1rem', fontWeight: '500' }}>
                🎯 Curated by TheSkint • 🆓 100% Free • 🗽 All 5 Boroughs
              </span>
            </div>
          </div>

          {/* Categories */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ 
              color: 'white', 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              textAlign: 'center',
              marginBottom: '2rem',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}>
              Browse by Category
            </h2>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '1rem',
              justifyContent: 'center',
              marginBottom: '2rem'
            }}>
              <button
                className="category-btn"
                onClick={() => filterByCategory('All Events')}
                style={{
                  background: activeCategory === 'All Events' 
                    ? 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%)' 
                    : 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  border: activeCategory === 'All Events' 
                    ? '2px solid rgba(255,255,255,0.8)' 
                    : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '25px',
                  padding: '0.75rem 1.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  boxShadow: activeCategory === 'All Events' 
                    ? '0 8px 25px rgba(0,0,0,0.2)' 
                    : '0 4px 15px rgba(0,0,0,0.1)'
                }}
              >
                🌟 All Events ({events.length})
              </button>
              
              {Object.entries(categoryConfig).map(([category, config]) => (
                <button
                  key={category}
                  className="category-btn"
                  onClick={() => filterByCategory(category)}
                  style={{
                    background: activeCategory === category 
                      ? config.gradient 
                      : 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                    border: activeCategory === category 
                      ? '2px solid rgba(255,255,255,0.8)' 
                      : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '25px',
                    padding: '0.75rem 1.5rem',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    boxShadow: activeCategory === category 
                      ? '0 8px 25px rgba(0,0,0,0.2)' 
                      : '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                >
                  {config.emoji} {category} ({config.count})
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', 
            gap: '2rem',
            marginBottom: '4rem'
          }}>
            {filteredEvents.map((event, index) => (
              <div 
                key={index} 
                className="card-hover"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  padding: '2rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Category badge */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: categoryConfig[event.category]?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}>
                  {categoryConfig[event.category]?.emoji} {event.category}
                </div>

                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: 'white', 
                  marginBottom: '1.5rem',
                  marginTop: '2rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  lineHeight: '1.3'
                }}>
                  {event.title}
                </h3>
                
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '1rem', 
                    marginBottom: '1rem',
                    color: 'rgba(255,255,255,0.9)'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '0.5rem',
                      backdropFilter: 'blur(10px)'
                    }}>📍</div>
                    <div>
                      <div style={{ fontWeight: '600', color: 'white', marginBottom: '0.25rem' }}>Location</div>
                      <div style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>{event.location}</div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',
                    color: 'rgba(255,255,255,0.9)'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '0.5rem',
                      backdropFilter: 'blur(10px)'
                    }}>🕒</div>
                    <div>
                      <div style={{ fontWeight: '600', color: 'white', marginBottom: '0.25rem' }}>Time</div>
                      <div style={{ fontSize: '0.95rem' }}>{event.time}</div>
                    </div>
                  </div>
                </div>

                <p style={{ 
                  color: 'rgba(255,255,255,0.85)', 
                  fontSize: '0.95rem', 
                  marginBottom: '2rem',
                  lineHeight: '1.6',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {event.description}
                </p>

                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '15px',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <span>Get Details</span>
                  <span style={{ fontSize: '1.25rem' }}>🎟️</span>
                </a>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ 
            textAlign: 'center',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '2rem',
            border: '1px solid rgba(255,255,255,0.2)',
            marginTop: '4rem'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '15px',
                padding: '1.5rem',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                <div style={{ color: 'white', fontWeight: '600' }}>Last Updated</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  {new Date().toLocaleDateString()}
                </div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '15px',
                padding: '1.5rem',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
                <div style={{ color: 'white', fontWeight: '600' }}>Total Events</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  {events.length} Free Events
                </div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '15px',
                padding: '1.5rem',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌆</div>
                <div style={{ color: 'white', fontWeight: '600' }}>Coverage</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  All 5 Boroughs
                </div>
              </div>
            </div>
            
            <div style={{ 
              paddingTop: '2rem',
              borderTop: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.8)'
            }}>
              <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                Data curated from{' '}
                <a 
                  href="https://theskint.com" 
                  style={{ 
                    color: '#ffd93d', 
                    textDecoration: 'none',
                    fontWeight: '600',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}
                >
                  TheSkint
                </a>
              </p>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                Made with modern web technologies • Real-time updates • Responsive design
              </p>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </div>
    </>
  );
}

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
} rgba(0,0,0,0.5)'
          }}>
            FREE NYC EVENTS
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#c4b5fd' }}>
            Discover {events.length} amazing free events across NYC
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '2rem' 
        }}>
          {events.map((event, index) => (
            <div key={index} style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.3s ease'
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                color: 'white', 
                marginBottom: '1rem' 
              }}>
                {event.title}
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem', 
                  marginBottom: '0.75rem',
                  color: '#c4b5fd'
                }}>
                  <span style={{ fontSize: '1.125rem' }}>📍</span>
                  <div>
                    <div style={{ fontWeight: '500', color: 'white' }}>Location</div>
                    <div style={{ fontSize: '0.875rem' }}>{event.location}</div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  color: '#c4b5fd'
                }}>
                  <span style={{ fontSize: '1.125rem' }}>🕒</span>
                  <div>
                    <div style={{ fontWeight: '500', color: 'white' }}>Time</div>
                    <div style={{ fontSize: '0.875rem' }}>{event.time}</div>
                  </div>
                </div>
              </div>

              <p style={{ 
                color: '#c4b5fd', 
                fontSize: '0.875rem', 
                marginBottom: '1.5rem',
                lineHeight: '1.4'
              }}>
                {event.description}
              </p>

              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  width: '100%',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontWeight: '500',
                  textAlign: 'center',
                  textDecoration: 'none',
                  transition: 'background-color 0.3s ease',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Get Details 🎟️
              </a>
            </div>
          ))}
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '4rem', 
          color: '#c4b5fd' 
        }}>
          <p>
            Data curated from{' '}
            <a 
              href="https://theskint.com" 
              style={{ color: '#fbbf24', textDecoration: 'none' }}
            >
              TheSkint
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

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
