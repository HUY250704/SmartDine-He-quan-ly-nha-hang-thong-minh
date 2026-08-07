export default function AboutPage() {
  return (
    <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <h2 className="text-2xl font-bold text-white">About SmartDine</h2>
      <p className="mt-4 text-on-surface-variant/60">
        This starter includes React, Vite, Tailwind, React Router, Axios, Socket.IO, Express, MongoDB, and Mongoose.
      </p>
    </div>
  );
}
