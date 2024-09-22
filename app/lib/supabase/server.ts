import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "./database.types"; // Adjust this import path as needed

export const createClient = () => {
  if (!process.env.PUBLIC_SUPABASE_URL) {
    throw new Error("Missing PUBLIC_SUPABASE_URL environment variable");
  }
  return createServerComponentClient<Database>({
    cookies: cookies
  });
};
