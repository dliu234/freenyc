import { useEffect, useState } from 'react';
import Head from 'next/head';
import EventCard from '../components/EventCard';

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/events.json')
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error('Failed to load events:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <Head>
        <title>FreeNYC - Free Events in NYC</title>
        <meta name="description" content="Discover free events happening in New York City every day." />
      </Head>
      <h1 className="text-3xl font-bold mb-6">🎉 Free Events in NYC</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event, index) => (
          <EventCard key={index} event={event} />
        ))}
      </div>
    </div>
  );
}