// src/lib/queryClient.ts - FINAL CORRECT VERSION
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient"; // A .ts kiterjesztés nem kell importnál

// 🔥 1. BASE URL DEFINIÁLÁSA
// Ez a legfontosabb sor a telefonos működéshez!
const BASE_URL = import.meta.env.VITE_API_URL || 'https://aprod-app-kkcr.onrender.com';

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

// 🔥 2. EXPORT HOZZÁADVA: Hogy más fájlokban is tudd használni
export async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// 🔥 3. OKOS URL KEZELÉS (JAVÍTVA)
// Most már MINDIG elé teszi a https://...render.com címet, ha nem teljes URL-t kap
export function getApiUrl(endpoint: string): string {
  // Ha már teljes URL (pl. external API), hagyjuk
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // Levágjuk az esetleges vezető perjelet a duplázás elkerülése végett
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Ha az endpoint már tartalmazza, hogy /api, akkor is elé kell tenni a BASE_URL-t!
  // Telefonon: https://aprod.../api/questions
  // Weben: https://aprod.../api/questions
  return `${BASE_URL}${cleanEndpoint}`;
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
  // Ha FormData-t küldünk (fájl feltöltés), NEM szabad Content-Type-ot állítani kézzel!
  const isFormData = data instanceof FormData;
  
  const baseHeaders: Record<string, string> = !isFormData && data
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
    body: isFormData ? (data as FormData) : (data ? JSON.stringify(data) : undefined),
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
    // A queryKey elemeit összefűzzük, pl: ['api', 'questions'] -> 'api/questions'
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