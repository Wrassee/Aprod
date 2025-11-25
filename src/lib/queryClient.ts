// src/lib/queryClient.ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient.ts";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch (e) {
      errorData = await res.text();
    }
    
    const message = errorData?.message || (typeof errorData === 'string' ? errorData : res.statusText);
    console.error("❌ API Error Response:", errorData);
    throw new Error(`${res.status}: ${message}`);
  }
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// 🔥 OKOS URL KEZELÉS
// Development: /api/* → proxy átirányítja :5000-re
// Production/Android: /api/* → ugyanaz a szerver
function getApiUrl(endpoint: string): string {
  // Ha már teljes URL (pl. external API), hagyjuk
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // Ha /api/-vel kezdődik, hagyjuk relatívnak
  if (endpoint.startsWith('/api')) {
    return endpoint;
  }
  
  // Ha nem, előre tesszük az /api prefixet
  return `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}

// ====================================================================
//  MUTATIONS
// ====================================================================
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  
  const authHeaders = await getAuthHeaders();
  const baseHeaders: Record<string, string> = data
    ? { "Content-Type": "application/json" }
    : {};

  const finalUrl = getApiUrl(url);
  console.log(`📤 ${method} ${finalUrl}`);

  const res = await fetch(finalUrl, {
    method,
    headers: {
      ...baseHeaders,
      ...authHeaders,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

// ====================================================================
//  QUERIES
// ====================================================================
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    
    const authHeaders = await getAuthHeaders();
    const path = queryKey.join("/");
    const finalUrl = getApiUrl(path);

    console.log(`📥 GET ${finalUrl}`);

    const res = await fetch(finalUrl, {
      headers: authHeaders,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.warn("⚠️ 401 Unauthorized - returning null");
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});