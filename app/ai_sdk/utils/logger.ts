export const logger = {
  error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error),
  info: (message: string) => console.log(`[INFO] ${message}`),
  // ... add other log levels as needed
};
