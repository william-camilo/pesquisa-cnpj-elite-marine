# API Reference - Pesquisa CNPJ Elite Marine

## 📡 Endpoints tRPC

Todos os endpoints estão sob `/api/trpc` e requerem autenticação (exceto login).

### Base URL
```
https://cnpjmarine-tuvxncpz.manus.space/api/trpc
```

---

## 🔍 CNPJ Search

### `cnpj.search`

Busca informações de um CNPJ com validação e fallback de APIs.

**Tipo:** `protectedProcedure` (requer autenticação)

**Input:**
```typescript
{
  cnpj: string  // Formato: "XX.XXX.XXX/XXXX-XX" ou "14 dígitos"
}
```

**Output:**
```typescript
{
  cnpj: string                         // 14 dígitos
  company_name: string                 // Nome da empresa
  status: string                       // "ATIVA" | "INATIVA" | "SUSPENSA"
  optante_simples_nacional: boolean    // Optante SN
  founding_date: string                // "YYYY-MM-DD"
  legal_nature: string                 // Natureza jurídica
  address: string                      // Endereço completo
  simei: boolean                       // Indicador SIMEI
}
```

**Exemplo de Uso (Frontend):**
```typescript
const { data, isLoading, error } = trpc.cnpj.search.useQuery({
  cnpj: "11.222.333/0001-81"
});
```

**Exemplo de Uso (Backend):**
```typescript
const result = await caller.cnpj.search({
  cnpj: "11.222.333/0001-81"
});
```

**Erros Possíveis:**
- `UNAUTHORIZED` - Usuário não autenticado
- `BAD_REQUEST` - CNPJ inválido
- `NOT_FOUND` - CNPJ não encontrado nas APIs
- `INTERNAL_SERVER_ERROR` - Erro ao consultar APIs

**Fluxo:**
1. Validar CNPJ (dígito verificador)
2. Buscar no histórico local (cache)
3. Se não encontrado: Consultar APIs em paralelo
4. Salvar resultado no histórico
5. Retornar dados

---

### `cnpj.searchByName`

Busca empresas no histórico por nome com Fuzzy Search.

**Tipo:** `protectedProcedure` (requer autenticação)

**Input:**
```typescript
{
  name: string  // Mínimo 3 caracteres
}
```

**Output:**
```typescript
Array<{
  cnpj: string                    // 14 dígitos
  company_name: string            // Nome da empresa
  alias?: string                  // Apelido (se encontrado via apelido)
  similarity_score?: number       // 0-1 (Levenshtein Distance)
}>
```

**Exemplo de Uso:**
```typescript
const { data } = trpc.cnpj.searchByName.useQuery({
  name: "Elite Marine"
});

// Resultado:
// [
//   {
//     cnpj: "11222333000181",
//     company_name: "Elite Marine Ltda",
//     similarity_score: 0.95
//   }
// ]
```

**Algoritmo:**
- Levenshtein Distance (similaridade de strings)
- Mínimo 60% de similaridade
- Considera apelidos cadastrados
- Ordena por score decrescente

---

### `cnpj.getHistory`

Retorna histórico de pesquisas do usuário.

**Tipo:** `protectedProcedure` (requer autenticação)

**Input:**
```typescript
{}  // Sem parâmetros
```

**Output:**
```typescript
Array<{
  cnpj: string
  company_name: string
  status: string
  optante_simples_nacional: boolean
  founding_date: string
  legal_nature: string
  address: string
  simei: boolean
  createdAt: Date
}>
```

**Exemplo de Uso:**
```typescript
const { data: history } = trpc.cnpj.getHistory.useQuery({});

// Resultado: Array com todos os CNPJs pesquisados
```

**Notas:**
- Retorna até 1000 registros
- Ordenado por data decrescente (mais recentes primeiro)
- Dados isolados por usuário

---

### `cnpj.deleteFromHistory`

Remove um CNPJ do histórico.

**Tipo:** `protectedProcedure` (requer autenticação)

**Input:**
```typescript
{
  cnpj: string  // 14 dígitos
}
```

**Output:**
```typescript
{
  success: boolean
}
```

**Exemplo de Uso:**
```typescript
const deleteHistoryMutation = trpc.cnpj.deleteFromHistory.useMutation();

await deleteHistoryMutation.mutateAsync({
  cnpj: "11222333000181"
});
```

---

## 🏷️ Aliases (Apelidos)

### `cnpj.addAlias`

Adiciona um apelido para uma empresa.

**Tipo:** `protectedProcedure` (requer autenticação)

**Input:**
```typescript
{
  cnpj: string   // 14 dígitos
  alias: string  // Nome do apelido
}
```

**Output:**
```typescript
{
  id: number
  cnpj: string
  alias: string
  createdAt: Date
}
```

**Exemplo de Uso:**
```typescript
const addAliasMutation = trpc.cnpj.addAlias.useMutation();

const result = await addAliasMutation.mutateAsync({
  cnpj: "11222333000181",
  alias: "Elite Marine Brasil"
});
```

**Validações:**
- CNPJ deve existir no histórico
- Alias não pode estar vazio
- Máximo 255 caracteres

---

### `cnpj.updateAlias`

Atualiza um apelido existente.

**Tipo:** `protectedProcedure` (requer autenticação)

**Input:**
```typescript
{
  id: number     // ID do apelido
  alias: string  // Novo nome
}
```

**Output:**
```typescript
{
  id: number
  cnpj: string
  alias: string
}
```

**Exemplo de Uso:**
```typescript
const updateAliasMutation = trpc.cnpj.updateAlias.useMutation();

await updateAliasMutation.mutateAsync({
  id: 1,
  alias: "Elite Marine - Filial SP"
});
```

---

### `cnpj.deleteAlias`

Remove um apelido.

**Tipo:** `protectedProcedure` (requer autenticação)

**Input:**
```typescript
{
  id: number  // ID do apelido
}
```

**Output:**
```typescript
{
  success: boolean
}
```

**Exemplo de Uso:**
```typescript
const deleteAliasMutation = trpc.cnpj.deleteAlias.useMutation();

await deleteAliasMutation.mutateAsync({
  id: 1
});
```

---

### `cnpj.getAliases`

Retorna todos os apelidos de uma empresa.

**Tipo:** `protectedProcedure` (requer autenticação)

**Input:**
```typescript
{
  cnpj: string  // 14 dígitos
}
```

**Output:**
```typescript
Array<{
  id: number
  cnpj: string
  alias: string
  createdAt: Date
}>
```

**Exemplo de Uso:**
```typescript
const { data: aliases } = trpc.cnpj.getAliases.useQuery({
  cnpj: "11222333000181"
});
```

---

## 👤 Autenticação

### `auth.me`

Retorna informações do usuário autenticado.

**Tipo:** `publicProcedure`

**Input:**
```typescript
{}  // Sem parâmetros
```

**Output:**
```typescript
{
  id: string
  email: string
  name: string
  role: "admin" | "user"
} | null  // null se não autenticado
```

**Exemplo de Uso:**
```typescript
const { data: user } = trpc.auth.me.useQuery({});

if (user) {
  console.log(`Bem-vindo, ${user.name}!`);
} else {
  console.log("Não autenticado");
}
```

---

### `auth.logout`

Faz logout do usuário.

**Tipo:** `protectedProcedure` (requer autenticação)

**Input:**
```typescript
{}  // Sem parâmetros
```

**Output:**
```typescript
{
  success: boolean
}
```

**Exemplo de Uso:**
```typescript
const logoutMutation = trpc.auth.logout.useMutation();

await logoutMutation.mutateAsync({});

// Redirecionar para login
window.location.href = getLoginUrl();
```

---

## 🔄 Padrões de Uso

### Query (GET - Sem efeitos colaterais)

```typescript
// Usar useQuery para dados que não mudam frequentemente
const { data, isLoading, error } = trpc.cnpj.getHistory.useQuery({});

// Com dependências
const { data: aliases } = trpc.cnpj.getAliases.useQuery(
  { cnpj: selectedCNPJ },
  { enabled: !!selectedCNPJ }  // Só executa se selectedCNPJ existe
);
```

### Mutation (POST/PUT/DELETE - Com efeitos colaterais)

```typescript
// Usar useMutation para operações que modificam dados
const searchMutation = trpc.cnpj.search.useMutation({
  onSuccess: (data) => {
    console.log("Busca realizada:", data);
  },
  onError: (error) => {
    console.error("Erro:", error);
  }
});

// Executar
await searchMutation.mutateAsync({ cnpj: "11.222.333/0001-81" });
```

### Otimistic Updates

```typescript
const addAliasMutation = trpc.cnpj.addAlias.useMutation({
  onMutate: async (newAlias) => {
    // Cancelar queries em voo
    await utils.cnpj.getAliases.cancel();
    
    // Snapshot dos dados antigos
    const previousAliases = utils.cnpj.getAliases.getData();
    
    // Atualizar cache otimisticamente
    utils.cnpj.getAliases.setData(
      { cnpj: newAlias.cnpj },
      (old) => [...(old || []), newAlias]
    );
    
    return { previousAliases };
  },
  onError: (err, newAlias, context) => {
    // Reverter em caso de erro
    if (context?.previousAliases) {
      utils.cnpj.getAliases.setData(
        { cnpj: newAlias.cnpj },
        context.previousAliases
      );
    }
  },
  onSettled: () => {
    // Revalidar dados após sucesso ou erro
    utils.cnpj.getAliases.invalidate();
  }
});
```

---

## 📊 Códigos de Erro

| Código | Descrição | Solução |
|--------|-----------|---------|
| `UNAUTHORIZED` | Usuário não autenticado | Fazer login |
| `FORBIDDEN` | Usuário sem permissão | Contatar admin |
| `BAD_REQUEST` | Dados inválidos | Verificar entrada |
| `NOT_FOUND` | Recurso não encontrado | Verificar ID/CNPJ |
| `CONFLICT` | Conflito (ex: duplicado) | Verificar duplicatas |
| `INTERNAL_SERVER_ERROR` | Erro no servidor | Tentar novamente |
| `TIMEOUT` | Requisição expirou | Tentar novamente |

---

## 🔐 Autenticação e Autorização

### Headers Obrigatórios

```
Cookie: session=<jwt_token>
Content-Type: application/json
```

### Fluxo de Autenticação

1. **Login:** Redirecionar para OAuth
2. **Callback:** `/api/oauth/callback` cria sessão
3. **Cookie:** `session` é criado (HttpOnly, Secure)
4. **Requisições:** Cookie enviado automaticamente
5. **Validação:** JWT validado no backend

### Proteção de Dados

- Cada usuário só vê seus próprios dados
- Histórico isolado por `user_id`
- Apelidos isolados por `user_id`

---

## 📈 Rate Limiting

**Não implementado atualmente**

Recomendações para produção:
- 100 requisições por minuto por IP
- 1000 requisições por hora por usuário
- Timeout de 30s para requisições

---

## 🧪 Exemplos Completos

### Exemplo 1: Buscar CNPJ e Salvar Apelido

```typescript
import { trpc } from '@/lib/trpc';

export function SearchAndAlias() {
  const [cnpj, setCnpj] = useState('');
  const [alias, setAlias] = useState('');
  
  const searchMutation = trpc.cnpj.search.useMutation();
  const addAliasMutation = trpc.cnpj.addAlias.useMutation();
  
  const handleSearch = async () => {
    const result = await searchMutation.mutateAsync({ cnpj });
    setAlias(result.company_name); // Pré-preencher com nome
  };
  
  const handleAddAlias = async () => {
    await addAliasMutation.mutateAsync({ 
      cnpj: cnpj.replace(/\D/g, ''),
      alias 
    });
    alert('Apelido adicionado!');
  };
  
  return (
    <div>
      <input 
        value={cnpj} 
        onChange={(e) => setCnpj(e.target.value)}
        placeholder="CNPJ"
      />
      <button onClick={handleSearch}>Buscar</button>
      
      {searchMutation.data && (
        <>
          <input 
            value={alias} 
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Apelido"
          />
          <button onClick={handleAddAlias}>Salvar Apelido</button>
        </>
      )}
    </div>
  );
}
```

### Exemplo 2: Listar Histórico com Busca

```typescript
import { trpc } from '@/lib/trpc';

export function HistoryList() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: history } = trpc.cnpj.getHistory.useQuery({});
  
  const filtered = history?.filter(item =>
    item.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cnpj.includes(searchTerm)
  ) || [];
  
  return (
    <div>
      <input 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar..."
      />
      
      <ul>
        {filtered.map(item => (
          <li key={item.cnpj}>
            {item.company_name} ({item.cnpj})
            <span>{item.optante_simples_nacional ? '🔴' : '🟢'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

**Versão:** 1.0.0
**Última atualização:** 20 de julho de 2026
