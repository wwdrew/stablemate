import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { PropsWithChildren } from "react";

import { queryClient, queryPersister } from "@/api/queryClient";

export function QueryProvider({ children }: PropsWithChildren) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
