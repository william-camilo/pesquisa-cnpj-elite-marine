import { describe, it, expect } from 'vitest';

/**
 * Converte letra para seu valor numérico conforme especificação da Receita Federal
 * A=10, B=11, ..., Z=35
 */
const letterToNumber = (letter: string): number => {
  const code = letter.toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return code - 55; // A=10, B=11, ..., Z=35
  }
  return parseInt(letter);
};

/**
 * Remove caracteres especiais mantendo letras e números
 */
const cleanCNPJ = (value: string): string => {
  let clean = value.replace(/[\.\/-\s]/g, '').toUpperCase();
  if (!/^[A-Z0-9]*$/.test(clean)) {
    return '';
  }
  return clean;
};

/**
 * Valida CNPJ numérico (14 dígitos)
 */
const isValidNumericCNPJ = (clean: string): boolean => {
  if (!/^\d{14}$/.test(clean)) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(clean[i]) * weights1[i];
  }
  let remainder1 = sum1 % 11;
  const digit1 = remainder1 < 2 ? 0 : 11 - remainder1;
  
  if (parseInt(clean[12]) !== digit1) return false;
  
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3];
  let sum2 = 0;
  for (let i = 0; i < 12; i++) {
    sum2 += parseInt(clean[i]) * weights2[i];
  }
  sum2 += digit1 * 2;
  let remainder2 = sum2 % 11;
  const digit2 = remainder2 < 2 ? 0 : 11 - remainder2;
  
  return parseInt(clean[13]) === digit2;
};

/**
 * Valida CNPJ alfanumérico (novo formato)
 */
const isValidAlphanumericCNPJ = (clean: string): boolean => {
  if (!/^[A-Z0-9]{12}\d{2}$/.test(clean)) return false;
  if (/^(.)\1{13}$/.test(clean)) return false;
  
  const numericValues: number[] = [];
  for (let i = 0; i < 12; i++) {
    numericValues.push(letterToNumber(clean[i]));
  }
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += numericValues[i] * weights1[i];
  }
  let remainder1 = sum1 % 11;
  const digit1 = remainder1 < 2 ? 0 : 11 - remainder1;
  
  if (parseInt(clean[12]) !== digit1) return false;
  
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3];
  let sum2 = 0;
  for (let i = 0; i < 12; i++) {
    sum2 += numericValues[i] * weights2[i];
  }
  sum2 += digit1 * 2;
  let remainder2 = sum2 % 11;
  const digit2 = remainder2 < 2 ? 0 : 11 - remainder2;
  
  return parseInt(clean[13]) === digit2;
};

describe('CNPJ Alfanumérico - Novo Formato (31/07/2026)', () => {
  describe('letterToNumber', () => {
    it('deve converter letras para números', () => {
      expect(letterToNumber('A')).toBe(10);
      expect(letterToNumber('B')).toBe(11);
      expect(letterToNumber('Z')).toBe(35);
    });
  });

  describe('cleanCNPJ', () => {
    it('deve remover formatação e manter letras', () => {
      expect(cleanCNPJ('AB.123.456/0001-81')).toBe('AB123456000181');
      expect(cleanCNPJ('11.222.333/0001-81')).toBe('11222333000181');
    });

    it('deve converter para maiúscula', () => {
      expect(cleanCNPJ('ab.123.456/0001-81')).toBe('AB123456000181');
    });
  });

  describe('isValidNumericCNPJ', () => {
    it('deve validar CNPJ numérico válido', () => {
      expect(isValidNumericCNPJ('11222333000181')).toBe(true);
    });

    it('deve rejeitar CNPJ numérico inválido', () => {
      expect(isValidNumericCNPJ('11222333000180')).toBe(false);
    });

    it('deve rejeitar sequência repetida', () => {
      expect(isValidNumericCNPJ('11111111111111')).toBe(false);
    });
  });

  describe('isValidAlphanumericCNPJ', () => {
    it('deve validar CNPJ alfanumérico com formato correto', () => {
      expect(isValidAlphanumericCNPJ('AB123456000195')).toBe(true);
    });

    it('deve rejeitar CNPJ alfanumérico com dígito verificador inválido', () => {
      expect(isValidAlphanumericCNPJ('AB12345600010')).toBe(false);
    });

    it('deve rejeitar CNPJ alfanumérico com tamanho inválido', () => {
      expect(isValidAlphanumericCNPJ('AB1234560001')).toBe(false);
    });

    it('deve rejeitar sequência repetida', () => {
      expect(isValidAlphanumericCNPJ('AAAAAAAAAAA00')).toBe(false);
    });
  });

  describe('Ambos os formatos convivendo', () => {
    it('deve aceitar CNPJ numérico antigo', () => {
      expect(isValidNumericCNPJ('11222333000181')).toBe(true);
    });

    it('deve aceitar CNPJ alfanumérico novo', () => {
      expect(isValidAlphanumericCNPJ('AB123456000195')).toBe(true);
    });
  });
});
