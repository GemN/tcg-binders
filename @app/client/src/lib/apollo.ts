import {
  ApolloClient,
  ApolloLink,
  createHttpLink,
  defaultDataIdFromObject,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

import { getGlobalUserContext } from "@/providers/UserContextContext";

import supabase from "./supabase";

const cache = new InMemoryCache({
  dataIdFromObject(responseObject) {
    if ("nodeId" in responseObject) {
      return `${responseObject.nodeId}`;
    }

    return defaultDataIdFromObject(responseObject);
  },
});

const onErrorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: message: ${message}, location: ${JSON.stringify(
          locations
        )}, path: ${JSON.stringify(path)}`
      );
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

const httpLink = createHttpLink({
  uri: `${import.meta.env.VITE_SUPABASE_URL}/graphql/v1`,
});

const getBinderShortIdFromPath = (): string | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  const match = window.location.pathname.match(/^\/binder\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
};

const authLink = setContext(async (_, { headers }) => {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  const context = getGlobalUserContext();
  const binderShortId = getBinderShortIdFromPath();

  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : "",
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      "x-binder-short-id": binderShortId,
      "x-organization-id": context?.organizationId || undefined,
    },
  };
});

const apolloClient = new ApolloClient({
  link: ApolloLink.from([onErrorLink, authLink, httpLink]),
  cache,
});

export default apolloClient;
