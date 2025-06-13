export default function EventCard({ event }: { event: any }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md border">
      <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
      <p><strong>📍 Location:</strong> {event.location}</p>
      <p><strong>🕒 Time:</strong> {event.date} {event.time}</p>
      <p className="my-2">{event.description}</p>
      <p><strong>🔗 Source:</strong> <a href={event.source} target="_blank" className="text-blue-600 underline">{event.source}</a></p>
      <p><strong>✅ RSVP Required:</strong> {event.rsvp_required ? "Yes" : "No"}</p>
    </div>
  );
}