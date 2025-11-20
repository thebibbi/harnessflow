/**
 * Client-side Providers
 *
 * Wraps the app with necessary providers (Apollo, etc.)
 */

'use client';

import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/graphql/client';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
