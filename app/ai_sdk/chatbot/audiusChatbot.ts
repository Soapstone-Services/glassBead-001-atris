import { AudiusAPI } from '../tools/audius/audiusAPI';

export class AudiusChatbot {
  constructor(private audiusAPI: AudiusAPI) {}
  
  async processMessage(input: string): Promise<string> {
    try {
      console.log('AudiusChatbot: Processing message:', input);
      const result = await this.audiusAPI._call(input);
      console.log('AudiusChatbot: API result:', result);
      return result;
    } catch (error) {
      console.error('Error processing message:', error);
      if (error instanceof Error) {
        return `I'm sorry, but I encountered an error while processing your request: ${error.message}. Could you please try again or rephrase your question?`;
      }
      return "An unexpected error occurred. Please try again later.";
    }
  }
}