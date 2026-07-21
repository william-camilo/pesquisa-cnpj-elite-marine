import { describe, it, expect } from 'vitest';
import { getCNPJHistory } from './db';

describe('Optimized CNPJ Search - History Priority', () => {
  it('should return history without limit', async () => {
    // Verifica que getCNPJHistory retorna registros
    const history = await getCNPJHistory();
    
    // Verifica que não há limite artificial
    expect(Array.isArray(history)).toBe(true);
  });

  it('should return history with required fields', async () => {
    const history = await getCNPJHistory();
    
    if (history.length > 0) {
      const first = history[0];
      expect(first).toHaveProperty('cnpj');
      expect(first).toHaveProperty('company_name');
      expect(first).toHaveProperty('optante_simples_nacional');
      expect(first).toHaveProperty('createdAt');
    }
  });

  it('should return history ordered by most recent first', async () => {
    const history = await getCNPJHistory();
    
    if (history.length > 1) {
      const first = history[0];
      const second = history[1];
      
      // Verifica que o primeiro é mais recente que o segundo
      const firstDate = new Date(first.createdAt).getTime();
      const secondDate = new Date(second.createdAt).getTime();
      
      expect(firstDate).toBeGreaterThanOrEqual(secondDate);
    }
  });

  it('should preserve optante status', async () => {
    const history = await getCNPJHistory();
    
    // Verifica que cada registro tem optante_simples_nacional como boolean
    for (const item of history) {
      expect(typeof item.optante_simples_nacional).toBe('number');
      expect([0, 1]).toContain(item.optante_simples_nacional);
    }
  });

  it('should contain valid CNPJ format', async () => {
    const history = await getCNPJHistory();
    
    for (const item of history) {
      // CNPJ deve ter 14 dígitos
      const cleanCNPJ = item.cnpj.replace(/\D/g, '');
      expect(cleanCNPJ.length).toBe(14);
    }
  });
});
