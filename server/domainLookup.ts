import * as cheerio from 'cheerio';

/**
 * Buscar CNPJ por domínio usando múltiplas estratégias
 * 1. Tenta SiteConfiável (web scraping)
 * 2. Fallback para CNPJ.ws
 */

export async function lookupCNPJByDomain(domain: string): Promise<string | null> {
  // Limpar domínio (remover www., https://, etc)
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .toLowerCase()
    .trim();

  try {
    // Opção A: Tentar SiteConfiável
    console.log(`[domainLookup] Tentando SiteConfiável para: ${cleanDomain}`);
    const cnpjFromSiteConfiavel = await lookupSiteConfiavel(cleanDomain);
    if (cnpjFromSiteConfiavel) {
      console.log(`[domainLookup] CNPJ encontrado no SiteConfiável: ${cnpjFromSiteConfiavel}`);
      return cnpjFromSiteConfiavel;
    }
  } catch (error) {
    console.error(`[domainLookup] Erro ao buscar no SiteConfiável:`, error);
  }

  try {
    // Opção C: Fallback para CNPJ.ws (busca por domínio)
    console.log(`[domainLookup] Tentando CNPJ.ws para: ${cleanDomain}`);
    const cnpjFromCNPJWS = await lookupCNPJWS(cleanDomain);
    if (cnpjFromCNPJWS) {
      console.log(`[domainLookup] CNPJ encontrado no CNPJ.ws: ${cnpjFromCNPJWS}`);
      return cnpjFromCNPJWS;
    }
  } catch (error) {
    console.error(`[domainLookup] Erro ao buscar no CNPJ.ws:`, error);
  }

  console.log(`[domainLookup] Nenhum CNPJ encontrado para: ${cleanDomain}`);
  return null;
}

/**
 * Buscar CNPJ via SiteConfiável usando web scraping
 */
async function lookupSiteConfiavel(domain: string): Promise<string | null> {
  try {
    const url = `https://www.siteconfiavel.com.br/site/${domain}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log(`[siteConfiavel] Status ${response.status} para ${domain}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Procurar por padrão CNPJ na página
    // Exemplo: "CNPJ: 21.902.548/0001-05"
    const cnpjPattern = /CNPJ[:\s]+(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i;
    const match = html.match(cnpjPattern);

    if (match && match[1]) {
      return match[1];
    }

    // Tentar buscar em elementos específicos
    const cnpjText = $('*').text();
    const cnpjMatch = cnpjText.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
    if (cnpjMatch && cnpjMatch[1]) {
      return cnpjMatch[1];
    }

    return null;
  } catch (error) {
    console.error(`[siteConfiavel] Erro:`, error);
    return null;
  }
}

/**
 * Buscar CNPJ via CNPJ.ws (API com fallback para busca por domínio)
 */
async function lookupCNPJWS(domain: string): Promise<string | null> {
  try {
    // CNPJ.ws não tem endpoint direto de domínio, mas podemos tentar
    // fazer uma busca genérica ou usar outra estratégia
    // Por enquanto, retornamos null para indicar que precisa de fallback adicional
    return null;
  } catch (error) {
    console.error(`[cnpjws] Erro:`, error);
    return null;
  }
}

/**
 * Extrair CNPJ de um texto usando regex
 */
export function extractCNPJFromText(text: string): string | null {
  const cnpjPattern = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/;
  const match = text.match(cnpjPattern);
  return match ? match[1] : null;
}

/**
 * Validar formato de domínio
 */
export function isValidDomain(domain: string): boolean {
  const domainPattern = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  return domainPattern.test(domain);
}
