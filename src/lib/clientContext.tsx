import { createContext, useContext, type ReactNode } from 'react'
import { supabase, type SupabaseClient } from './supabase'

const ClientContext = createContext<SupabaseClient>(supabase)

export function DataClientProvider({ client, children }: { client: SupabaseClient; children: ReactNode }) {
  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
}

export function useDataClient(): SupabaseClient {
  return useContext(ClientContext)
}
