# Auditoria de Autenticação - Bom Conselho
**Agente:** Authentication & Access Agent  
**Data:** 2026-01-12  
**Status:** ⚠️ FUNCIONAL MAS REQUER MELHORIAS

---

## 📋 Análise do Sistema Atual

### Arquitetura Atual:

```
AuthProvider (AuthContext.tsx)
    ↓
localStorage (isLoggedIn, userRole, currentSchoolName)
    ↓
ProtectedRoute (validação de acesso)
    ↓
Pages (Index, Students, Reports, Settings)
```

---

## 🔍 Componentes Analisados

### 1. **AuthContext.tsx** - Estado de Autenticação

**Responsabilidades:**
- Gerenciar estado de login (`isLoggedIn`, `userRole`)
- Persistir sessão em `localStorage`
- Fornecer funções `login()` e `logout()`

**Código Atual:**
```typescript
type UserRole = 'admin' | 'teacher' | 'coordinator' | null;

interface AuthContextType {
  isLoggedIn: boolean;
  userRole: UserRole;
  login: (role: UserRole, schoolName?: string) => void;
  logout: () => void;
}
```

---

### 2. **LoginPage.tsx** - Interface de Login

**Implementação:**
- Login **simulado** (hardcoded: `admin/admin`)
- Timeout de 1 segundo para simular async
- Toast notifications
- Recupera `schoolName` do localStorage

**Código Crítico:**
```typescript
// Linha 27-38
if (username === 'admin' && password === 'admin') {
  const savedSchool = localStorage.getItem('schoolInfo');
  const schoolName = savedSchool ? JSON.parse(savedSchool).name : undefined;
  login('admin', schoolName);
  navigate('/');
}
```

---

### 3. **ProtectedRoute.tsx** - Controle de Acesso

**Lógica:**
```typescript
if (!isLoggedIn) {
  return <Navigate to="/login" />;
}

if (requiresAdmin && userRole !== 'admin') {
  return <Navigate to="/" />;
}

return <Outlet />;
```

**Rotas Protegidas:**
- `/` - Qualquer usuário autenticado
- `/students` - Qualquer usuário autenticado
- `/reports` - Qualquer usuário autenticado
- `/settings` - **Apenas admin**

---

## ⚠️ Problemas Identificados

### 1. **Login Hardcoded** 🔴 CRÍTICO

**Problema:**
```typescript
if (username === 'admin' && password === 'admin') {
  // Login bem-sucedido
}
```

**Riscos:**
- ❌ Credenciais expostas no código
- ❌ Sem validação real
- ❌ Sem proteção contra brute force
- ❌ Não escalável para múltiplos usuários

---

### 2. **Falta de Validação de Contexto** 🟡 MÉDIO

**Problema:**
```typescript
export const useAuth = () => useContext(AuthContext);
```

**Risco:**
- ⚠️ Sem validação se está dentro do Provider
- ⚠️ Pode retornar `undefined` e causar crash

**Comparação com StudentsContext:**
```typescript
// StudentsContext tem validação ✅
export const useStudents = () => {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error('useStudents must be used within a StudentsProvider');
  }
  return context;
};
```

---

### 3. **currentSchool Não Exposto** 🟡 MÉDIO

**Problema:**
```typescript
const [currentSchool, setCurrentSchool] = useState<string | undefined>(undefined);
// ...
return (
  <AuthContext.Provider value={{ isLoggedIn, userRole, login, logout }}>
    {children}  {/* currentSchool não está no value! */}
  </AuthContext.Provider>
);
```

**Impacto:**
- ⚠️ `currentSchool` é armazenado mas nunca acessível
- ⚠️ Componentes não podem usar essa informação

---

### 4. **Logout Incompleto** 🟢 BAIXO

**Problema:**
```typescript
const logout = () => {
  setIsLoggedIn(false);
  setUserRole(null);
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userRole');
  // ❌ Não remove 'currentSchoolName'!
};
```

**Impacto:**
- ⚠️ Dados de escola permanecem após logout
- ⚠️ Possível vazamento de informação

---

### 5. **Sem Expiração de Sessão** 🟡 MÉDIO

**Problema:**
- ❌ Sessão nunca expira
- ❌ `localStorage` persiste indefinidamente
- ❌ Sem refresh token ou timeout

**Risco:**
- ⚠️ Sessão ativa mesmo após dias/semanas
- ⚠️ Computador compartilhado = risco de segurança

---

### 6. **Roles Não Utilizados** 🟢 BAIXO

**Problema:**
```typescript
type UserRole = 'admin' | 'teacher' | 'coordinator' | null;
```

**Observação:**
- ✅ `admin` é usado
- ❌ `teacher` nunca usado
- ❌ `coordinator` nunca usado

**Impacto:**
- ⚠️ Código preparado para roles que não existem
- ⚠️ Pode causar confusão

---

### 7. **UI Elementos Não Funcionais** 🟢 BAIXO

**LoginPage.tsx:**
```typescript
// Linha 122-136
<input type="checkbox" id="remember" />  {/* Não faz nada */}
<a href="#">Esqueceu a senha?</a>  {/* Não funciona */}
```

**Impacto:**
- ⚠️ UX confusa (botões que não funcionam)
- ⚠️ Expectativa vs realidade

---

## ✅ Pontos Positivos

### 1. **Estrutura Sólida**
- ✅ Context API bem implementado
- ✅ Separação de responsabilidades
- ✅ ProtectedRoute funcional

### 2. **Persistência Funciona**
- ✅ `localStorage` persiste sessão
- ✅ Reload da página mantém login
- ✅ `useEffect` restaura estado

### 3. **Navegação Correta**
- ✅ Redirecionamento para `/login` funciona
- ✅ Proteção de rotas admin funciona
- ✅ Navegação após login funciona

### 4. **UX Básica Boa**
- ✅ Loading state durante login
- ✅ Toast notifications
- ✅ Show/hide password
- ✅ Design limpo

---

## 🎯 Modelo de Autenticação Proposto

### Requisitos:
1. ✅ **Admin cria usuários** (não há self-registration)
2. ✅ **Login nunca bloqueia rendering**
3. ✅ **Separar admin vs user logic**
4. ✅ **Preparar base para paid accounts**
5. ✅ **Estabilidade > features**

### Arquitetura Proposta:

```
Supabase Auth
    ↓
AuthContext (com validação)
    ↓
ProtectedRoute (com loading state)
    ↓
Pages (com fallback)
```

---

## 🔧 Plano de Correção

### Fase 1: Estabilizar Contexto (ALTA PRIORIDADE)

**Objetivo:** Prevenir crashes do AuthContext

**Mudanças:**
1. Adicionar validação em `useAuth()`
2. Expor `currentSchool` no context
3. Corrigir `logout()` para limpar tudo
4. Adicionar loading state

**Commit:** `fix(auth): add context validation and expose currentSchool`

---

### Fase 2: Preparar para Supabase Auth (ALTA PRIORIDADE)

**Objetivo:** Migrar de hardcoded para Supabase Auth

**Mudanças:**
1. Criar função `authenticateUser(email, password)`
2. Integrar com Supabase Auth
3. Manter fallback para demo (admin/admin)
4. Adicionar error handling robusto

**Commit:** `feat(auth): integrate Supabase authentication`

---

### Fase 3: Implementar Expiração de Sessão (MÉDIA PRIORIDADE)

**Objetivo:** Sessões não devem durar para sempre

**Mudanças:**
1. Adicionar timestamp de login
2. Verificar expiração (ex: 24h)
3. Auto-logout se expirado
4. Toast notification antes de expirar

**Commit:** `feat(auth): add session expiration (24h)`

---

### Fase 4: Limpar Roles Não Usados (BAIXA PRIORIDADE)

**Objetivo:** Simplificar código

**Mudanças:**
1. Remover `teacher` e `coordinator` se não usados
2. OU implementar lógica para esses roles
3. Documentar diferenças entre roles

**Commit:** `refactor(auth): simplify user roles`

---

### Fase 5: Preparar para Paid Accounts (BAIXA PRIORIDADE)

**Objetivo:** Base para monetização futura

**Mudanças:**
1. Adicionar campo `accountType` (free/paid)
2. Adicionar campo `features` (array de features)
3. Criar helper `hasFeature(feature)`
4. Não implementar paywall ainda

**Commit:** `feat(auth): add account type and features foundation`

---

## 📊 Comparação: Antes vs Depois

### AuthContext - ANTES (Atual):
```typescript
export const useAuth = () => useContext(AuthContext);
// ❌ Sem validação
// ❌ currentSchool não exposto
// ❌ Logout incompleto
```

### AuthContext - DEPOIS (Proposto):
```typescript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
// ✅ Com validação
// ✅ currentSchool exposto
// ✅ Logout completo
// ✅ Session expiration
```

---

## 🎯 Critérios de Sucesso

### ✅ Sucesso Mínimo:
- ✅ AuthContext nunca causa crash
- ✅ Login funciona (mesmo que simulado)
- ✅ Logout limpa tudo
- ✅ currentSchool acessível

### ✅ Sucesso Completo:
- ✅ Integração com Supabase Auth
- ✅ Sessão expira após 24h
- ✅ Error handling robusto
- ✅ Loading states adequados

### ✅ Sucesso Ideal:
- ✅ Admin pode criar usuários
- ✅ Base para paid accounts
- ✅ Roles bem definidos
- ✅ Documentação clara

---

## ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Quebrar login atual | Média | Manter fallback admin/admin |
| Supabase não configurado | Baixa | Verificar antes de implementar |
| Breaking changes | Média | Testes extensivos |
| UX degradada | Baixa | Loading states adequados |

---

## 📝 Checklist de Implementação

### Fase 1: Estabilizar Contexto
- [ ] Adicionar validação em `useAuth()`
- [ ] Expor `currentSchool` no context value
- [ ] Corrigir `logout()` para limpar `currentSchoolName`
- [ ] Adicionar `isLoading` state
- [ ] Testar em todos os consumidores
- [ ] Commit

### Fase 2: Supabase Auth
- [ ] Verificar Supabase configurado
- [ ] Criar função `authenticateUser()`
- [ ] Integrar com Supabase Auth
- [ ] Manter fallback admin/admin
- [ ] Adicionar error handling
- [ ] Testar login/logout
- [ ] Commit

### Fase 3: Session Expiration
- [ ] Adicionar `loginTimestamp` ao context
- [ ] Criar função `isSessionExpired()`
- [ ] Auto-logout se expirado
- [ ] Toast notification 5min antes
- [ ] Testar expiração
- [ ] Commit

### Fase 4: Limpar Roles
- [ ] Decidir: remover ou implementar teacher/coordinator
- [ ] Atualizar tipos
- [ ] Atualizar documentação
- [ ] Commit

### Fase 5: Paid Accounts Foundation
- [ ] Adicionar `accountType` ao context
- [ ] Adicionar `features` array
- [ ] Criar `hasFeature()` helper
- [ ] Documentar uso futuro
- [ ] Commit

---

## 🎯 Priorização

### AGORA (Fase 1):
- 🔴 **Estabilizar Contexto** - Prevenir crashes

### EM BREVE (Fase 2):
- 🟡 **Supabase Auth** - Autenticação real

### DEPOIS (Fases 3-5):
- 🟢 **Session Expiration** - Segurança
- 🟢 **Limpar Roles** - Manutenibilidade
- 🟢 **Paid Accounts** - Monetização futura

---

**Auditoria concluída por:** Authentication & Access Agent  
**Próximo passo:** Implementar Fase 1 (Estabilizar Contexto)
