export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    // Loop through the retry attempts
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Attempt to execute the provided operation
        return await operation();
      } catch (error) {
        // If this is the last retry attempt, throw the error
        if (i === maxRetries - 1) throw error;
        
        // Calculate the delay for this retry attempt
        // The delay increases exponentially with each retry
        const retryDelay = delay * Math.pow(2, i);
        
        // Wait for the calculated delay before the next retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Log the retry attempt (optional)
        console.log(`Retry attempt ${i + 1} after ${retryDelay}ms delay`);
      }
    }
    // This line will never be reached, but it satisfies TypeScript
    throw new Error('Max retries reached');
  }
