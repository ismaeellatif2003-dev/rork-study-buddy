import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  try {
    console.log('🔗 Initializing tRPC client...');
    
    if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
      console.log('✅ Base URL found:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
      return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    }

    console.error('❌ No base URL found in environment variables');
    throw new Error(
      "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
    );
  } catch (error) {
    console.error('❌ Error in getBaseUrl:', error);
    throw error;
  }
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: (url, options) => {
        console.log('🌐 tRPC request:', url);
        return fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        }).catch(error => {
          console.error('❌ tRPC fetch error:', error);
          throw error;
        });
      },
    }),
  ],
});