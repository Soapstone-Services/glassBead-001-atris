import { NextRequest, NextResponse } from 'next/server';
import { AudiusAPI } from '../../ai_sdk/tools/audiusAPI';
import { AudiusChatbot } from '../../ai_sdk/chatbot/audiusChatbot';

// the chatbot is initialized once and reused for all requests
let chatbot: AudiusChatbot | null = null;

export async function POST(req: NextRequest) {
  console.log('Received POST request to /api/chatbot');

  if (!chatbot) {
    console.log('Initializing chatbot');
    const audiusAPI = new AudiusAPI('AudiusChatbotApp');
    await audiusAPI.initialize();
    chatbot = new AudiusChatbot(audiusAPI);
    await chatbot.initialize();
    console.log('Chatbot initialized successfully');
  }

  const { message } = await req.json();

  if (!message) {
    console.error('Message is required but not provided');
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  try {
    console.log('Processing message:', message);
    const response = await chatbot.processMessage(message);
    console.log('Chatbot response:', response);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error processing message:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred while processing the message' }, { status: 500 });
  }
}