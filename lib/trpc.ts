import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Development
  if (__DEV__) {
    return 'http://localhost:3000';
  }
  
  // Production - Railway backend
  return 'https://rork-study-buddy-production-eeeb.up.railway.app';
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/trpc`,
      transformer: superjson,
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        }).catch(error => {
          console.error('tRPC fetch error:', error);
          throw error;
        });
      },
    }),
  ],
});