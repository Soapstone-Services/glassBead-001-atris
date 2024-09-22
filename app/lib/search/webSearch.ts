import axios from 'axios';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

const AUDIUS_DOMAINS = [
  'audius.co',
  'audius.org',
  'blog.audius.co',
  'docs.audius.org',
  'discord.com/invite/audius',
  'twitter.com/AudiusProject',
  'github.com/AudiusProject'
];

export async function performWebSearch(query: string): Promise<string> {
  try {
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: TAVILY_API_KEY,
      query,
      search_depth: "basic",
      include_answer: true,
      max_results: 5,
      include_domains: AUDIUS_DOMAINS
    });

    if (response.data.answer) {
      return response.data.answer;
    } else if (response.data.results && response.data.results.length > 0) {
      return response.data.results.map((result: any) => `${result.title}: ${result.content}`).join('\n\n');
    } else {
      return "No results found on official Audius sources.";
    }
  } catch (error) {
    console.error('Error performing web search:', error);
    return "An error occurred while searching Audius information.";
  }
}