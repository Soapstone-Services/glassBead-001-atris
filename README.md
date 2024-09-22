# Langchain x Audius API/SDK

(a public service brought to you by [TRICK CHENEY.](https://audius.co/mynameiscards))

Hadn't seen an AI integration template for Audius yet, so here we are. I started building out a chatbot to demonstrate that the integration works, and the chatbot has become a larger-scale undertaking that I'll be working on for the [Amplify Hackathon (09/23 - 09/30)](https://www.audius.events/e/hackathon) separately from this repo, but I thought the community might appreciate a jumping-off point for building other apps with Langchain that involve the Audius API or SDK.

- [Simple chat](/app/api/chat/route.ts)
- [Fetch and format Audius data for Supabase](app/api/chat/retrieval/route.ts)
- [Ingestion/embeddings for vector storage of Audius data](scripts/ingestAudiusData.ts)
- [READMEASSISTANT](READMEASSISTANT.md): READMEASSISTANT is a rudimentary tool I came up with to persist some interthread context between LLM conversations in Cursor. Have the AI update a READMEASSISTANT periodically with the goal of "passing the baton" to another AI assistant after the current session ends. Experiment with it.

## Some notes

There's a lot of unused/context-impertinent code from the [Langchain x Next.js Starter Template](https://github.com/langchain-ai/langchain-nextjs-template/tree/main) from the folks at Langchain (a template I drew from liberally: much thanks!!), as well as half-built support for similarity searches via Supabase. I'm open-sourcing the integration now and tidying up later in the interest of adhering to the hackathon rules, competitive spirit and all that.

The chatbot in this repo is not good: you can ask it how many plays a certain song by a certain artist has, and you can perform essential ranking-based queries (i.e. "What is Deadmau5's most popular track on Audius?"), but beyond that it's very incomplete: what I hope this repo can do for other Audius devs is eliminate a few days of troubleshooting and refactoring if you're trying to get off the ground with a Langchain x Audius application.

## 🚀 Getting Started

First, clone this repo and download it locally.

Next, you'll need to set up environment variables in your repo's `.env.local` file. Copy the `.env.example` file to `.env.local`.
To start with the basic examples, you'll just need to add your OpenAI API key. I have a [constants.ts](app/lib/chat/constants.ts) file with variables for the keys and such you'll need to generate/provide separately. Everything's either free or very, very cheap to use (< $0.05/week if you're developing a *lot*).

Next, install the required packages using your preferred package manager (e.g. `npm`).

Now you're ready to run the development server:

```zsh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result! Ask the bot how many plays one of your tracks has, or what your favorite artist's most-played song is on the platform.


