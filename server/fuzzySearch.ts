import { compareTwoStrings } from 'string-similarity';

/**
 * Normaliza string para comparação: remove acentos, converte para minúsculas, remove espaços extras
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcula score de similaridade entre duas strings (0-1)
 * 0 = completamente diferentes
 * 1 = idênticas
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);
  return compareTwoStrings(normalized1, normalized2);
}

/**
 * Interface para resultado de busca fuzzy
 */
export interface FuzzySearchResult {
  cnpj: string;
  company_name: string;
  alias?: string;
  similarity_score: number;
  source: 'history' | 'alias'; // De onde veio o resultado
}

/**
 * Busca fuzzy em um array de strings
 * Retorna apenas resultados com score >= minScore
 */
export function fuzzySearchInArray(
  query: string,
  items: Array<{ cnpj: string; name: string; alias?: string }>,
  minScore: number = 0.6
): FuzzySearchResult[] {
  const results: FuzzySearchResult[] = [];

  for (const item of items) {
    // Calcula similaridade com o nome da empresa
    const nameScore = calculateSimilarity(query, item.name);

    // Se tem alias, também calcula similaridade com o alias
    const aliasScore = item.alias ? calculateSimilarity(query, item.alias) : 0;

    // Pega o maior score entre nome e alias
    const maxScore = Math.max(nameScore, aliasScore);

    if (maxScore >= minScore) {
      results.push({
        cnpj: item.cnpj,
        company_name: item.name,
        alias: item.alias,
        similarity_score: maxScore,
        source: aliasScore > nameScore ? 'alias' : 'history',
      });
    }
  }

  // Ordena por score decrescente
  return results.sort((a, b) => b.similarity_score - a.similarity_score);
}

/**
 * Exemplo de uso:
 * 
 * const items = [
 *   { cnpj: '12345678000190', name: 'comercio de peças do josé', alias: 'josé negócios' },
 *   { cnpj: '98765432000101', name: 'empresa xyz ltda', alias: 'xyz' },
 * ];
 * 
 * const results = fuzzySearchInArray('josé negócios', items);
 * // Retorna: [{ cnpj: '12345678000190', company_name: 'comercio de peças do josé', alias: 'josé negócios', similarity_score: 0.95, source: 'alias' }]
 */
