# Pesquisa CNPJ Elite Marine - TODO

## Funcionalidades Implementadas

- [x] Logo Elite Marine no header
- [x] Campo de CNPJ com máscara (pontos, barras e traços)
- [x] Validação de CNPJ com algoritmo de dígito verificador
- [x] Consulta via APIs públicas (ReceitaWS, CNPJ.ws, OpenCNPJ) com fallbacks
- [x] Resultado colorido: verde para não optante, vermelho para optante
- [x] UI clean com design minimalista corporativo azul
- [x] Tipografia: Poppins (títulos), Inter (corpo), JetBrains Mono (CNPJ)
- [x] Histórico persistente de até 1000 CNPJs no banco de dados
- [x] Botão X para deletar itens do histórico
- [x] Barra de busca no topo direito para filtrar histórico
- [x] Logo substituída com novo design Elite Marine
- [x] Barra de busca superior removida
- [x] Busca de histórico movida para acima das 'Últimas 5 Pesquisas'
- [x] Campo de busca por nome de empresa (busca no histórico local)
- [x] Informações do SIMEI exibidas no resultado da consulta
- [x] Testes unitários para funcionalidade de busca por nome

## Próximas Etapas

- [x] Validar funcionalidade em produção
- [x] Coletar feedback dos usuários
- [x] Otimizações de performance se necessário
- [x] Reexecutar testes automatizados após correção do erro de renderização
- [x] Validar fluxos principais sem erros em ambiente publicado
- [x] Testar busca por nome, preenchimento automático e consulta de CNPJ

## Sistema de Variantes de Nomes (Nova Feature)

- [x] Criar tabela `company_aliases` no banco de dados
- [x] Implementar algoritmo de Fuzzy Search (Levenshtein distance)
- [x] Criar endpoint tRPC para buscar com Fuzzy Search
- [x] Criar UI para adicionar apelidos a uma empresa
- [x] Criar UI para gerenciar apelidos (listar, editar, deletar)
- [x] Integrar Fuzzy Search na busca por nome existente
- [x] Testes unitários para Fuzzy Search
- [x] Testes unitários para gerenciamento de apelidos
- [x] Validar em produção com variantes reais

## Busca por Domínio (Planejado para Futuro)

Esta funcionalidade foi planejada mas não foi implementada nesta versão.
Requer integração com SiteConfiável ou outra API de busca de domínio.
Pode ser adicionada em uma versão futura quando as APIs forem validadas.

## Melhorias Solicitadas (Sessão Atual)

- [x] Aumentar tamanho da logo para preencher área do cabeçalho
- [x] Implementar busca preditiva no histórico (resultados em tempo real conforme digita)
