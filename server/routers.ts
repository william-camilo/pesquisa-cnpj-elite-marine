import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import axios from "axios";
import { saveCNPJHistory, getCNPJHistory, deleteCNPJHistory, addCompanyAlias, getCompanyAliases, getAllAliases, deleteCompanyAlias, updateCompanyAlias } from "./db";
import { fuzzySearchInArray } from "./fuzzySearch";
import { getCachedCNPJ, setCachedCNPJ } from "./cache";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  cnpj: router({
    search: publicProcedure
      .input(z.object({ cnpj: z.string() }))
      .query(async ({ input }) => {
        // Suporta CNPJ alfanumérico (novo formato a partir de 31/07/2026)
        // Mantém letras e números, remove caracteres especiais
        let cleanCNPJ = input.cnpj.replace(/[\.\/-\s]/g, '').toUpperCase();
        
        // Valida que contém apenas letras (A-Z) e dígitos
        if (!/^[A-Z0-9]*$/.test(cleanCNPJ)) {
          throw new Error('CNPJ contém caracteres inválidos');
        }

        if (cleanCNPJ.length !== 14) {
          throw new Error('CNPJ deve conter 14 caracteres');
        }

        // Verifica cache primeiro (funciona para ambos os formatos)
        const cached = getCachedCNPJ(cleanCNPJ);
        if (cached) {
          return cached;
        }

        // Para CNPJ alfanumérico, converte para numérico para busca nas APIs
        // (as APIs ainda usam formato numérico)
        const isAlphanumeric = /[A-Z]/.test(cleanCNPJ);
        let numericCNPJ = cleanCNPJ;
        
        if (isAlphanumeric) {
          // Extrai apenas os dígitos para busca nas APIs
          numericCNPJ = cleanCNPJ.replace(/[A-Z]/g, '');
          if (numericCNPJ.length !== 14) {
            throw new Error('CNPJ alfanumérico inválido: deve conter 12 caracteres + 2 dígitos verificadores');
          }
        }

        const apiUrls = [
          `https://www.receitaws.com.br/v1/cnpj/${numericCNPJ}`,
          `https://www.cnpj.ws/api/${numericCNPJ}`,
          `https://www.opencnpj.com.br/api/v1/cnpj/${numericCNPJ}`,
        ];

        // Dispara chamadas em paralelo com timeout reduzido (5s por API)
        const apiPromises = apiUrls.map(url =>
          axios.get(url, {
            timeout: 5000, // Reduzido de 10s para 5s
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'pesquisa-cnpj-elite-marine/1.0',
            },
          })
            .then(response => ({
              success: true,
              data: response.data,
              url,
            }))
            .catch(err => ({
              success: false,
              error: err,
              url,
              code: axios.isAxiosError(err) ? err.code : 'UNKNOWN',
              status: axios.isAxiosError(err) ? err.response?.status : 'N/A',
            }))
        );

        // Aguarda a primeira resposta bem-sucedida
        const results = await Promise.all(apiPromises);
        
        for (const result of results) {
          if (!result.success) {
            const errorResult = result as any;
            const isRateLimit = errorResult.status === 429;
            const isTimeout = errorResult.code === 'ECONNABORTED' || errorResult.code === 'ETIMEDOUT';
            
            if (isRateLimit) {
              console.warn(`[cnpj.search] Rate limit na API ${result.url}`);
            } else if (isTimeout) {
              console.warn(`[cnpj.search] Timeout na API ${result.url}`);
            } else {
              console.error(`[cnpj.search] Erro ao consultar ${result.url}:`, errorResult.code, errorResult.status);
            }
            continue;
          }

          const apiData = (result as any).data;

          if (apiData.status === 'ERROR') {
            console.log(`[cnpj.search] API retornou erro: ${apiData.message}`);
            continue;
          }

          console.log(`[cnpj.search] Sucesso com URL: ${result.url}`);

          // Determinar se é optante do Simples Nacional
          let isOptante = false;
          
          // ReceitaWS retorna objeto simples com propriedade optante
          if (apiData.simples && typeof apiData.simples === 'object' && 'optante' in apiData.simples) {
            isOptante = apiData.simples.optante === true;
          }
          // CNPJ.ws pode retornar simples_nacional como string 'S' ou boolean
          else if (apiData.simples_nacional === 'S' || apiData.simples_nacional === true) {
            isOptante = true;
          }
          // OpenCNPJ pode retornar optante_simples_nacional
          else if (apiData.optante_simples_nacional === true) {
            isOptante = true;
          }
          // Fallback para campo simples como string
          else if (apiData.simples === 'S') {
            isOptante = true;
          }

          console.log(`[cnpj.search] CNPJ ${numericCNPJ} - Optante: ${isOptante}`);

          const resultData = {
            cnpj: cleanCNPJ, // Retorna no formato original (alfanumérico ou numérico)
            company_name: apiData.nome || apiData.razao_social || apiData.company_name || 'N/A',
            status: apiData.status || apiData.situacao || 'ATIVA',
            optante_simples_nacional: isOptante,
            founding_date: apiData.abertura || apiData.data_abertura || apiData.founding_date,
            legal_nature: apiData.natureza_juridica || apiData.legal_nature,
            address: apiData.logradouro || apiData.endereco || apiData.address,
            simei: typeof apiData.simei === 'string' ? apiData.simei : (typeof apiData.mei === 'string' ? apiData.mei : undefined),
            api_source: result.url.includes('receitaws') ? 'ReceitaWS' : 
                       result.url.includes('cnpj.ws') ? 'CNPJ.ws' : 
                       result.url.includes('opencnpj') ? 'OpenCNPJ' : 'Unknown',
          };

          // Armazena no cache
          setCachedCNPJ(cleanCNPJ, resultData);

          // Salva no histórico
          await saveCNPJHistory({
            cnpj: numericCNPJ, // Salva no formato numérico para compatibilidade
            company_name: resultData.company_name,
            status: resultData.status,
            optante_simples_nacional: isOptante ? 1 : 0,
            founding_date: typeof resultData.founding_date === 'string' ? resultData.founding_date : undefined,
            legal_nature: typeof resultData.legal_nature === 'string' ? resultData.legal_nature : undefined,
            address: typeof resultData.address === 'string' ? resultData.address : undefined,
          });

          return resultData;
        }

        // Se chegou aqui, nenhuma API respondeu com sucesso
        // Diferencia o tipo de erro
        const hasRateLimit = results.some(r => !r.success && (r as any).status === 429);
        const hasTimeout = results.some(r => !r.success && ((r as any).code === 'ECONNABORTED' || (r as any).code === 'ETIMEDOUT'));
        
        if (hasRateLimit) {
          throw new Error('Muitas consultas realizadas. Tente novamente em 1 minuto.');
        } else if (hasTimeout) {
          throw new Error('Timeout ao consultar as bases de dados. Tente novamente em alguns instantes.');
        } else {
          throw new Error('CNPJ não encontrado em nenhuma base de dados. Verifique o número e tente novamente.');
        }
      }),
    getHistory: publicProcedure.query(async () => {
      const history = await getCNPJHistory();
      return history.map(item => ({
        cnpj: item.cnpj,
        company_name: item.company_name,
        status: item.status,
        optante_simples_nacional: item.optante_simples_nacional === 1,
        founding_date: item.founding_date,
        legal_nature: item.legal_nature,
        address: item.address,
        created_at: item.createdAt,
      }));
    }),
    deleteHistory: publicProcedure
      .input(z.object({ cnpj: z.string() }))
      .mutation(async ({ input }) => {
        const cleanCNPJ = input.cnpj.replace(/\D/g, '');
        await deleteCNPJHistory(cleanCNPJ);
        return { success: true };
      }),

    searchByName: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        const history = await getCNPJHistory();
        const aliases = await getAllAliases();

        // Combina histórico com apelidos
        const searchableItems = [
          ...history.map(item => ({
            cnpj: item.cnpj,
            name: item.company_name,
            alias: undefined,
          })),
          ...aliases.map(alias => ({
            cnpj: alias.cnpj,
            name: history.find(h => h.cnpj === alias.cnpj)?.company_name || 'N/A',
            alias: alias.alias,
          })),
        ];

        // Remove duplicatas
        const uniqueItems = Array.from(
          new Map(searchableItems.map(item => [item.cnpj + (item.alias || ''), item])).values()
        );

        // Busca fuzzy
        const results = fuzzySearchInArray(
          input.name,
          uniqueItems,
          0.6
        );

        return results.map(result => ({
          cnpj: result.cnpj,
          company_name: result.company_name,
          alias: result.alias,
          similarity_score: result.similarity_score,
        }));
      }),

    // Aliases (apelidos/variantes)
    addAlias: publicProcedure
      .input(z.object({ cnpj: z.string(), alias: z.string() }))
      .mutation(async ({ input }) => {
        const cleanCNPJ = input.cnpj.replace(/\D/g, '');
        const trimmedAlias = input.alias.trim();
        
        if (!trimmedAlias) {
          throw new Error('Apelido não pode estar vazio');
        }

        const result = await addCompanyAlias(cleanCNPJ, trimmedAlias);
        return result;
      }),

    getAliases: publicProcedure
      .input(z.object({ cnpj: z.string() }))
      .query(async ({ input }) => {
        const cleanCNPJ = input.cnpj.replace(/\D/g, '');
        const aliases = await getCompanyAliases(cleanCNPJ);
        return aliases;
      }),

    deleteAlias: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const result = await deleteCompanyAlias(input.id);
        return result;
      }),

    updateAlias: publicProcedure
      .input(z.object({ id: z.number(), alias: z.string() }))
      .mutation(async ({ input }) => {
        const trimmedAlias = input.alias.trim();
        
        if (!trimmedAlias) {
          throw new Error('Apelido não pode estar vazio');
        }

        const result = await updateCompanyAlias(input.id, trimmedAlias);
        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
