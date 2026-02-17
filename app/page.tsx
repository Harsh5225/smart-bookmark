export default function Page() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-5xl font-bold mb-4">🔖 Smart Bookmarks</h1>
      <p className="text-gray-400 text-lg mb-8">Save and organize your bookmarks in real-time</p>
      <a
        href="/login"
        className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-colors"
      >
        Get Started
      </a>
    </div>
  );
}