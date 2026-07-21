/**
 * Simple in-memory cache for CNPJ lookups
 * TTL: 24 horas (86400000 ms)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CNPJCacheData {
  cnpj: string;
  company_name: string;
  status: string;
  optante_simples_nacional: boolean;
  founding_date?: string;
  legal_nature?: string;
  address?: string;
  simei?: string;
  api_source?: string;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
const cnpjCache = new Map<string, CacheEntry<CNPJCacheData>>();

/**
 * Obtém um valor do cache se ainda estiver válido
 */
export function getCachedCNPJ(cnpj: string): CNPJCacheData | null {
  const entry = cnpjCache.get(cnpj);
  
  if (!entry) {
    return null;
  }
  
  const now = Date.now();
  const age = now - entry.timestamp;
  
  // Se expirou, remove do cache
  if (age > CACHE_TTL) {
    cnpjCache.delete(cnpj);
    return null;
  }
  
  console.log(`[Cache] CNPJ ${cnpj} encontrado no cache (idade: ${Math.round(age / 1000)}s)`);
  return entry.data;
}

/**
 * Armazena um CNPJ no cache
 */
export function setCachedCNPJ(cnpj: string, data: CNPJCacheData): void {
  cnpjCache.set(cnpj, {
    data,
    timestamp: Date.now(),
  });
  console.log(`[Cache] CNPJ ${cnpj} armazenado no cache`);
}

/**
 * Limpa o cache (útil para testes)
 */
export function clearCache(): void {
  cnpjCache.clear();
  console.log('[Cache] Cache limpo');
}

/**
 * Retorna informações do cache
 */
export function getCacheStats(): { size: number; ttl_hours: number } {
  return {
    size: cnpjCache.size,
    ttl_hours: CACHE_TTL / (60 * 60 * 1000),
  };
}
