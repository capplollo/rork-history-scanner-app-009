import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import Constants from 'expo-constants';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const rorkApiUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_RORK_API_BASE_URL || process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (rorkApiUrl) {
    return rorkApiUrl;
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});