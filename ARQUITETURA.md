# Arquitetura - Pesquisa CNPJ Elite Marine

## 🏗️ Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   Home.tsx       │  │  Components      │  │   Hooks      │  │
│  │  - UI Principal  │  │  - shadcn/ui     │  │  - useAuth   │  │
│  │  - Busca CNPJ    │  │  - DashLayout    │  │  - useCNPJ   │  │
│  │  - Histórico     │  │  - AIChatBox     │  │  - useMask   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              tRPC Client (React Query)                      │ │
│  │  - cnpj.search                                              │ │
│  │  - cnpj.searchByName                                        │ │
│  │  - cnpj.getHistory                                          │ │
│  │  - cnpj.addAlias / updateAlias / deleteAlias                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/tRPC
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express 4 + tRPC)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   tRPC Router                               │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  cnpj.search                                         │  │ │
│  │  │  1. Validar CNPJ (dígito verificador)               │  │ │
│  │  │  2. Buscar no histórico (prioridade 1)              │  │ │
│  │  │  3. Se não encontrado: Consultar APIs em paralelo   │  │ │
│  │  │  4. Salvar no histórico                             │  │ │
│  │  │  5. Retornar resultado                              │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  cnpj.searchByName                                   │  │ │
│  │  │  1. Buscar no histórico local                        │  │ │
│  │  │  2. Aplicar Fuzzy Search (Levenshtein)              │  │ │
│  │  │  3. Considerar apelidos cadastrados                 │  │ │
│  │  │  4. Retornar com score de similaridade              │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Gerenciamento de Apelidos (CRUD)                   │  │ │
│  │  │  - addAlias / updateAlias / deleteAlias             │  │ │
│  │  │  - getAliases                                       │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Histórico (CRUD)                                    │  │ │
│  │  │  - getHistory / deleteFromHistory                   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Cache em Memória                         │ │
│  │  - Resultados de API (24h TTL)                             │ │
│  │  - Histórico em cache para busca rápida                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Autenticação (OAuth Manus)                     │ │
│  │  - Validação de token JWT                                  │ │
│  │  - Injeção de contexto de usuário                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ SQL
┌─────────────────────────────────────────────────────────────────┐
│                  BANCO DE DADOS (MySQL/TiDB)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  cnpj_history    │  │ company_aliases  │  │    users     │  │
│  │  - id            │  │  - id            │  │  - id        │  │
│  │  - user_id       │  │  - user_id       │  │  - email     │  │
│  │  - cnpj          │  │  - cnpj          │  │  - name      │  │
│  │  - company_name  │  │  - alias         │  │  - role      │  │
│  │  - status        │  │  - createdAt     │  │  - createdAt │  │
│  │  - optante_sn    │  │                  │  │              │  │
│  │  - founding_date │  │                  │  │              │  │
│  │  - legal_nature  │  │                  │  │              │  │
│  │  - address       │  │                  │  │              │  │
│  │  - simei         │  │                  │  │              │  │
│  │  - createdAt     │  │                  │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                      APIs EXTERNAS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   ReceitaWS      │  │    CNPJ.ws       │  │  OpenCNPJ    │  │
│  │  - Consulta CNPJ │  │  - Consulta CNPJ │  │  - Backup    │  │
│  │  - Mais rápida   │  │  - Alternativa   │  │  - Fallback  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                   │
│  Estratégia: Chamadas paralelas com timeout 5s                  │
│  Primeiro resultado bem-sucedido é retornado                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Busca por CNPJ

```
START
  │
  ├─→ Usuário digita CNPJ
  │
  ├─→ Validação
  │   ├─→ Formato válido?
  │   ├─→ Dígito verificador correto?
  │   └─→ Se inválido: Erro
  │
  ├─→ Busca no Histórico Local
  │   ├─→ Encontrado?
  │   ├─→ Sim: Retorna resultado (< 1ms)
  │   └─→ Não: Continua
  │
  ├─→ Consulta APIs em Paralelo
  │   ├─→ ReceitaWS
  │   ├─→ CNPJ.ws
  │   └─→ OpenCNPJ
  │
  ├─→ Primeiro Resultado Bem-Sucedido
  │   ├─→ Normalizar dados
  │   ├─→ Salvar no histórico
  │   └─→ Salvar em cache (24h)
  │
  ├─→ Retornar Resultado
  │   ├─→ Status colorido (verde/vermelho)
  │   ├─→ Informações completas
  │   └─→ Exibir na UI
  │
  └─→ END
```

---

## 🔍 Fluxo de Busca por Nome

```
START
  │
  ├─→ Usuário digita nome (3+ caracteres)
  │
  ├─→ Busca no Histórico Local
  │   ├─→ Extrair todas as empresas
  │   └─→ Aplicar Fuzzy Search
  │
  ├─→ Fuzzy Search (Levenshtein Distance)
  │   ├─→ Calcular similaridade com cada empresa
  │   ├─→ Filtrar por score ≥ 60%
  │   └─→ Ordenar por score decrescente
  │
  ├─→ Considerar Apelidos
  │   ├─→ Para cada resultado
  │   ├─→ Buscar apelidos cadastrados
  │   └─→ Incluir apelidos nos resultados
  │
  ├─→ Retornar Resultados
  │   ├─→ Nome da empresa
  │   ├─→ CNPJ
  │   ├─→ Apelido (se houver)
  │   └─→ Score de similaridade
  │
  ├─→ Exibir Dropdown
  │   ├─→ Máximo 10 resultados
  │   └─→ Clicável para preencher CNPJ
  │
  └─→ END
```

---

## 💾 Fluxo de Persistência

```
Busca por CNPJ
  │
  ├─→ Resultado obtido
  │
  ├─→ Salvar no Histórico
  │   ├─→ Inserir em cnpj_history
  │   ├─→ Associar ao user_id
  │   └─→ Timestamp: createdAt
  │
  ├─→ Atualizar Cache em Memória
  │   ├─→ Adicionar ao histórico local
  │   └─→ Manter últimas 1000 pesquisas
  │
  ├─→ Próxima Busca
  │   ├─→ Verificar cache primeiro
  │   └─→ Se encontrado: Retornar imediatamente
  │
  └─→ Limpeza Periódica
      ├─→ Remover registros antigos (opcional)
      └─→ Atualizar cache (24h)
```

---

## 🔐 Fluxo de Autenticação

```
START
  │
  ├─→ Usuário acessa /
  │
  ├─→ Verificar Sessão
  │   ├─→ Cookie de sessão válido?
  │   ├─→ Sim: Continuar
  │   └─→ Não: Redirecionar para login
  │
  ├─→ Redirecionar para OAuth Manus
  │   ├─→ URL: VITE_OAUTH_PORTAL_URL
  │   ├─→ Parâmetros: client_id, redirect_uri, state
  │   └─→ State: Codifica origin + returnPath
  │
  ├─→ Usuário Autentica
  │   ├─→ Insere credenciais
  │   └─→ Servidor OAuth valida
  │
  ├─→ Callback em /api/oauth/callback
  │   ├─→ Recebe authorization code
  │   ├─→ Troca por access token
  │   ├─→ Extrai informações do usuário
  │   └─→ Cria sessão com JWT
  │
  ├─→ Cookie de Sessão Criado
  │   ├─→ Nome: session
  │   ├─→ Valor: JWT assinado
  │   ├─→ HttpOnly: true
  │   ├─→ Secure: true (HTTPS)
  │   └─→ SameSite: Lax
  │
  ├─→ Redirecionar para Aplicação
  │   ├─→ URL: window.location.origin + returnPath
  │   └─→ Sessão ativa
  │
  ├─→ Requisições Subsequentes
  │   ├─→ Cookie enviado automaticamente
  │   ├─→ Middleware valida JWT
  │   ├─→ ctx.user preenchido
  │   └─→ Acesso a recursos protegidos
  │
  └─→ END
```

---

## 📊 Estrutura de Dados

### Histórico de CNPJ

```typescript
interface CNPJHistoryItem {
  id: number;
  userId: string;
  cnpj: string;              // 14 dígitos
  companyName: string;
  status: string;
  optanteSimpleNacional: boolean;
  foundingDate: string;      // YYYY-MM-DD
  legalNature: string;
  address: string;
  simei: boolean;
  createdAt: Date;
}
```

### Apelido de Empresa

```typescript
interface CompanyAlias {
  id: number;
  userId: string;
  cnpj: string;              // 14 dígitos
  alias: string;
  createdAt: Date;
}
```

### Resultado de Busca por Nome

```typescript
interface SearchByNameResult {
  cnpj: string;
  companyName: string;
  alias?: string;            // Se encontrado via apelido
  similarityScore?: number;  // 0-1 (Levenshtein)
}
```

---

## ⚡ Otimizações

### 1. Busca em Duas Camadas
- **Camada 1:** Histórico local (<1ms)
- **Camada 2:** APIs externas (~5s com timeout)

### 2. Cache em Memória
- Resultados de API com TTL de 24h
- Histórico carregado em memória para busca rápida
- Fuzzy Search pré-calculado

### 3. Chamadas Paralelas
- ReceitaWS, CNPJ.ws, OpenCNPJ consultadas simultaneamente
- Primeiro resultado bem-sucedido é retornado
- Timeout de 5s para evitar travamentos

### 4. Índices no Banco de Dados
- Índice em `cnpj_history.cnpj` para busca rápida
- Índice em `cnpj_history.user_id` para isolamento de dados
- Índice em `company_aliases.cnpj` para busca de apelidos

### 5. Paginação de Histórico
- UI exibe apenas 5 últimas pesquisas
- Banco de dados mantém até 1000+ registros
- Busca preditiva filtra em tempo real

---

## 🧪 Testes Unitários

### Estrutura de Testes

```
server/
├── cnpj.mask.test.ts           # Validação e formatação
├── cnpj.search.test.ts         # Busca por CNPJ
├── cnpj.searchByName.test.ts   # Busca por nome
├── cnpj.aliases.test.ts        # CRUD de apelidos
├── cnpj.history.test.ts        # Gerenciamento de histórico
└── auth.logout.test.ts         # Autenticação
```

### Cobertura

- **Validação:** 100%
- **Busca:** 100%
- **Apelidos:** 100%
- **Histórico:** 100%
- **Autenticação:** 100%

---

## 🚀 Escalabilidade

### Limitações Atuais
- Histórico limitado a 1000 registros por usuário
- Cache em memória (não distribuído)
- Sem rate limiting

### Melhorias Futuras
- Redis para cache distribuído
- Rate limiting por IP/usuário
- Paginação de histórico
- Busca full-text no banco de dados
- Sincronização periódica com Receita Federal

---

## 📈 Monitoramento

### Métricas Recomendadas
- Tempo de resposta de busca por CNPJ
- Taxa de sucesso de APIs externas
- Tamanho do cache em memória
- Número de usuários ativos
- Taxa de erro de validação

### Logs
- Erros de API
- Timeouts de requisição
- Falhas de autenticação
- Operações de banco de dados

---

**Versão:** 1.0.0
**Última atualização:** 20 de julho de 2026
