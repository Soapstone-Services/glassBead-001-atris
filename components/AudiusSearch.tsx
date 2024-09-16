'use client';

import { useState } from 'react';

export default function AudiusSearch() {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState('10');
  const [result, setResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/audius?query=${encodeURIComponent(query)}&limit=${limit}`);
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error fetching Audius data:', error);
      setResult('Error fetching data from Audius');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search query"
        />
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder="Limit"
          min="1"
          max="100"
        />
        <button type="submit">Search</button>
      </form>
      <pre>{result}</pre>
    </div>
  );
}