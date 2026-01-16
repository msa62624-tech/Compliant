import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">Compliant Platform</h1>
        <p className="text-xl text-gray-600 mb-8">
          Professional contractor and insurance management
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Dashboard
          </Link>
        </div>
        <div className="mt-12 text-sm text-gray-500">
          <p>Built with Next.js 14, NestJS, PostgreSQL, and Prisma</p>
        </div>
      </div>
    </div>
  );
}
