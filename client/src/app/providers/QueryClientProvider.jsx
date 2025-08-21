// Not wired yet; wrap your app root with <AppQueryProvider> once @tanstack/react-query is installed
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const client = new QueryClient();

export default function AppQueryProvider({ children }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
