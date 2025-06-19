import fs from 'fs';
import path from 'path';
import { useState, useEffect } from 'react';

interface Event {
  title: string;
  location: string;
  time: string;
  description: string;
  link: string;
}

interface HomeProps {
  content: string;
}

export default function Home({ content }: HomeProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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
          };
        });
        
        setEvents(parsedEvents);
      }
      setIsLoaded(true);
    };

    parseEvents();
  }, [content]);

  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗽</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Loading NYC Events...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e293b 0%, #581c87 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ 
            fontSize: '4rem', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '1rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
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
