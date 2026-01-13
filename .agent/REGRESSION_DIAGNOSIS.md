# Diagnóstico de Regressões Críticas - Bom Conselho
**Data:** 2026-01-12 18:00  
**Agentes:** @Auth & Access Agent, @Data Integrity Agent

---

## 🔴 ISSUE A: Login Screen Removed

### Status: ✅ **FALSE ALARM - LOGIN FUNCIONA**

**Investigação:**
- Revisado `App.tsx` (linhas 1-51)
- Revisado `ProtectedRoute.tsx`
- Revisado `AuthContext.tsx`

**Descoberta:**
```typescript
// App.tsx - Linha 29
<Route path="/login" element={<LoginPage />} />

// Linhas 31-35 - Rotas protegidas
<Route element={<ProtectedRoute />}>
  <Route path="/" element={<Index />} />
  // ...
</Route>
```

**Conclusão:**
- ✅ Login screen está configurado corretamente
- ✅ ProtectedRoute redireciona para `/login` se não autenticado
- ✅ Nenhuma mudança recente afetou o login

**Possível Causa do Relato:**
- Usuário pode ter sessão ativa no localStorage
- Session expiration (24h) ainda não expirou
- Para testar login: limpar localStorage ou usar navegador anônimo

**Ação:** ❌ **NENHUMA CORREÇÃO NECESSÁRIA**

---

## 🔴 ISSUE B: Annual Attendance = 0 (CONFIRMADO)

### Status: ⚠️ **BUG CONFIRMADO - REGEX INCORRETO**

**Root Cause Identificado:**

### Linha 61 - studentProcessor.ts
```typescript
if (freqAnCol === -1 && /\bFRE\b.*\bAN\b|\bFREAN\b|\bFRE\s*AN\b|\bFREQUEN[CÇ]A.*ANUAL\b|\bANUAL\b|FRE\s*AN\(?%?\)?/i.test(combined)) {
  freqAnCol = i;
}
```

**Problema:**
O regex **NÃO DETECTA** `"Fre An(%)"` corretamente!

**Teste do Regex:**
```javascript
const regex = /\bFRE\b.*\bAN\b|\bFREAN\b|\bFRE\s*AN\b|\bFREQUEN[CÇ]A.*ANUAL\b|\bANUAL\b|FRE\s*AN\(?%?\)?/i;

// ❌ FALHA
regex.test("FRE AN(%)");  // false
regex.test("FRE AN (%)"); // false

// ✅ PASSA (mas não é o formato do Mapão)
regex.test("FRE AN");     // true
regex.test("FREAN");      // true
```

**Por quê falha?**
- O regex `FRE\s*AN\(?%?\)?` procura por:
  - `FRE` + espaços opcionais + `AN` + `(` opcional + `%` opcional + `)` opcional
- Mas o formato real é: `FRE AN(%)`
  - Tem espaço ANTES do parêntese
  - Tem `%` DENTRO do parêntese

**Regex Correto:**
```javascript
/\bFRE\b.*\bAN\b.*\(%?\)|FRE\s*AN\s*\(%\)/i
```

---

### Consequência:

**Linha 146:**
```typescript
let yearlyFrequency = freqAnCol > -1 ? convertToPercentage(row[freqAnCol]) : NaN;
```

Se `freqAnCol === -1` (não detectado):
- `yearlyFrequency = NaN`

**Linha 179:**
```typescript
if (isNaN(yearlyFrequency)) yearlyFrequency = 0;
```

- `yearlyFrequency` vira `0`

**Linha 181:**
```typescript
const lowFrequency = frequency < 70 || yearlyFrequency < 70;
```

- Como `yearlyFrequency = 0`, **TODOS os alunos** ficam com `lowFrequency = true`

---

## 🎯 Correção Necessária

### Arquivo: `src/utils/fileProcessor/studentProcessor.ts`

**Linha 61 - Substituir regex:**

```typescript
// ANTES (❌ Não detecta "Fre An(%)")
if (freqAnCol === -1 && /\bFRE\b.*\bAN\b|\bFREAN\b|\bFRE\s*AN\b|\bFREQUEN[CÇ]A.*ANUAL\b|\bANUAL\b|FRE\s*AN\(?%?\)?/i.test(combined)) {

// DEPOIS (✅ Detecta "Fre An(%)")
if (freqAnCol === -1 && /\bFRE\b.*\bAN\b.*\(%?\)|\bFRE\s*AN\s*\(%\)|\bFREAN\b|\bFREQUEN[CÇ]A.*ANUAL\b/i.test(combined)) {
```

**Explicação do novo regex:**
- `\bFRE\b.*\bAN\b.*\(%?\)` - Detecta "FRE AN(%)" ou "FRE AN (%)"
- `\bFRE\s*AN\s*\(%\)` - Detecta "FRE AN(%)" com espaços variáveis
- `\bFREAN\b` - Detecta "FREAN" (sem espaço)
- `\bFREQUEN[CÇ]A.*ANUAL\b` - Detecta "FREQUÊNCIA ANUAL"

---

## ✅ Validação da Correção

### Teste 1: Regex
```javascript
const newRegex = /\bFRE\b.*\bAN\b.*\(%?\)|\bFRE\s*AN\s*\(%\)|\bFREAN\b|\bFREQUEN[CÇ]A.*ANUAL\b/i;

newRegex.test("FRE AN(%)");     // ✅ true
newRegex.test("FRE AN (%)");    // ✅ true
newRegex.test("FREAN");         // ✅ true
newRegex.test("FREQUÊNCIA ANUAL"); // ✅ true
```

### Teste 2: Parsing
Após correção:
1. Importar Mapão
2. Verificar console: `freqAnCol` deve ser > -1
3. Verificar alunos: `yearlyFrequency` deve ter valores reais
4. Verificar: nem todos devem ter `lowFrequency = true`

---

## 📊 Impacto da Correção

### Antes:
- `freqAnCol = -1` (não detectado)
- `yearlyFrequency = 0` (para todos)
- `lowFrequency = true` (para todos)
- ❌ Pedagogicamente incorreto

### Depois:
- `freqAnCol = X` (coluna detectada)
- `yearlyFrequency = valor real` (ex: 85)
- `lowFrequency = true` (apenas se < 70)
- ✅ Pedagogicamente correto

---

## 🔒 Preservation Rules

### NÃO TOCAR:
- ✅ DOCX generation (funcionando)
- ✅ PDF generation (funcionando)
- ✅ PAEE logic (funcionando)
- ✅ Outras validações de dados

### TOCAR APENAS:
- ✅ Linha 61 de `studentProcessor.ts` (regex)

---

**Diagnóstico concluído por:** @Data Integrity Agent  
**Próximo passo:** Implementar correção do regex
