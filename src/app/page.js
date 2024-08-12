'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username) {
      router.push(`/${username}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">My Open-Source Contribution on GitHub</h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter GitHub username"
          className="mb-4 p-2 border border-gray-300 rounded text-black"
        />
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Show Contributions
        </button>
      </form>
    </main>
  );
}
