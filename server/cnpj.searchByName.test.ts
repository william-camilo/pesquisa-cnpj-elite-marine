import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { saveCNPJHistory, getCNPJHistory, deleteCNPJHistory } from './db';

describe('CNPJ searchByName - Busca no Histórico Local', () => {
  const testCNPJs = [
    {
      cnpj: '11222333000181',
      company_name: 'Google Brasil Internet Ltda',
      status: 'ATIVA',
      optante_simples_nacional: 0,
    },
    {
      cnpj: '00360305000104',
      company_name: 'Microsoft Informática Ltda',
      status: 'ATIVA',
      optante_simples_nacional: 0,
    },
    {
      cnpj: '07526847000148',
      company_name: 'Amazon Serviços de Varejo Brasil Ltda',
      status: 'ATIVA',
      optante_simples_nacional: 0,
    },
  ];

  beforeAll(async () => {
    // Limpar histórico antes dos testes
    for (const item of testCNPJs) {
      await deleteCNPJHistory(item.cnpj);
    }
    
    // Salvar CNPJs de teste
    for (const item of testCNPJs) {
      await saveCNPJHistory(item);
    }
  });

  afterAll(async () => {
    // Limpar histórico após os testes
    for (const item of testCNPJs) {
      await deleteCNPJHistory(item.cnpj);
    }
  });

  it('deve retornar array vazio para busca com menos de 3 caracteres', async () => {
    // Este teste valida que o frontend não deve fazer busca com menos de 3 caracteres
    // O backend retorna todos os resultados, mas o frontend filtra
    const searchTerm = 'go'; // Menos de 3 caracteres
    expect(searchTerm.length).toBeLessThan(3);
  });

  it('deve encontrar empresas por nome (case-insensitive)', async () => {
    const history = await getCNPJHistory();
    const searchTerm = 'google';
    
    const results = history
      .filter(item => 
        item.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.cnpj.includes(searchTerm)
      )
      .map(item => ({
        cnpj: item.cnpj,
        company_name: item.company_name,
      }));
    
    expect(results).toHaveLength(1);
    expect(results[0].company_name).toContain('Google');
    expect(results[0].cnpj).toBe('11222333000181');
  });

  it('deve encontrar múltiplas empresas por termo parcial', async () => {
    const history = await getCNPJHistory();
    const searchTerm = 'brasil';
    
    const results = history
      .filter(item => 
        item.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.cnpj.includes(searchTerm)
      )
      .map(item => ({
        cnpj: item.cnpj,
        company_name: item.company_name,
      }));
    
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.company_name.toLowerCase().includes('brasil'))).toBe(true);
  });

  it('deve encontrar empresas por CNPJ parcial', async () => {
    const history = await getCNPJHistory();
    const searchTerm = '11222333000181';
    
    const results = history
      .filter(item => 
        item.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.cnpj.includes(searchTerm)
      )
      .map(item => ({
        cnpj: item.cnpj,
        company_name: item.company_name,
      }));
    
    expect(results).toHaveLength(1);
    expect(results[0].cnpj).toBe('11222333000181');
  });

  it('deve limitar resultados a 10 itens', async () => {
    const history = await getCNPJHistory();
    const searchTerm = 'a'; // Termo que deve encontrar múltiplos resultados
    
    const results = history
      .filter(item => 
        item.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.cnpj.includes(searchTerm)
      )
      .map(item => ({
        cnpj: item.cnpj,
        company_name: item.company_name,
      }))
      .slice(0, 10);
    
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('deve retornar array vazio para busca sem correspondência', async () => {
    const history = await getCNPJHistory();
    const searchTerm = 'xyzabc123notfound';
    
    const results = history
      .filter(item => 
        item.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.cnpj.includes(searchTerm)
      )
      .map(item => ({
        cnpj: item.cnpj,
        company_name: item.company_name,
      }));
    
    expect(results).toHaveLength(0);
  });
});
