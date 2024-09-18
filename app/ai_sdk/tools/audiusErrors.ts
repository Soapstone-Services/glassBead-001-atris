export class AudiusAPIError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AudiusAPIError';
    }
  }
  
  export class AudiusAPIInitializationError extends AudiusAPIError {
    constructor(message: string) {
      super(message);
      this.name = 'AudiusAPIInitializationError';
    }
  }
  
  export class AudiusAPISearchError extends AudiusAPIError {
    constructor(message: string) {
      super(message);
      this.name = 'AudiusAPISearchError';
    }
  }