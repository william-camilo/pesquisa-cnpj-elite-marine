import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { addCompanyAlias, updateCompanyAlias, deleteCompanyAlias, getCompanyAliases } from './db';

describe('Company Alias Update', () => {
  const testCNPJ = '12345678000190';
  let aliasId: number;

  beforeAll(async () => {
    // Adicionar um apelido para testar
    await addCompanyAlias(testCNPJ, 'apelido original');
    const aliases = await getCompanyAliases(testCNPJ);
    if (aliases.length > 0) {
      aliasId = aliases[0].id;
    }
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (aliasId) {
      await deleteCompanyAlias(aliasId);
    }
  });

  it('deve atualizar um apelido existente', async () => {
    if (!aliasId) {
      expect.fail('Alias ID not found');
    }

    const success = await updateCompanyAlias(aliasId, 'apelido atualizado');
    expect(success).toBe(true);

    const aliases = await getCompanyAliases(testCNPJ);
    const updatedAlias = aliases.find(a => a.id === aliasId);
    expect(updatedAlias?.alias).toBe('apelido atualizado');
  });

  it('deve rejeitar apelido vazio', async () => {
    if (!aliasId) {
      expect.fail('Alias ID not found');
    }

    const success = await updateCompanyAlias(aliasId, '   ');
    expect(success).toBe(false);
  });

  it('deve trimmar espaços em branco', async () => {
    if (!aliasId) {
      expect.fail('Alias ID not found');
    }

    const success = await updateCompanyAlias(aliasId, '  apelido com espacos  ');
    expect(success).toBe(true);

    const aliases = await getCompanyAliases(testCNPJ);
    const updatedAlias = aliases.find(a => a.id === aliasId);
    expect(updatedAlias?.alias).toBe('apelido com espacos');
  });

  it('deve suportar caracteres especiais', async () => {
    if (!aliasId) {
      expect.fail('Alias ID not found');
    }

    const success = await updateCompanyAlias(aliasId, 'josé negócios & cia');
    expect(success).toBe(true);

    const aliases = await getCompanyAliases(testCNPJ);
    const updatedAlias = aliases.find(a => a.id === aliasId);
    expect(updatedAlias?.alias).toBe('josé negócios & cia');
  });
});
