# Diagnóstico DOCX - Bom Conselho
**Agente:** DOCX Generation Agent  
**Data:** 2026-01-12  
**Status:** 🔴 INSTÁVEL

---

## 📋 Análise do Código Atual

### Arquivos Envolvidos:
1. `src/utils/docxGenerator.ts` - Geração DOCX
2. `src/pages/ReportsPage.tsx` - Consumidor (UI)

---

## 🔍 Problemas Identificados

### 1. **Inconsistência no Try-Catch**

**Localização:** `docxGenerator.ts`

```typescript
// generateStudentDocx (linhas 48-53)
try {
  const blob = await Packer.toBlob(doc);
  return blob;
} catch (err) {
  throw new Error(`docx: falha ao gerar arquivo (.docx): ${err instanceof Error ? err.message : String(err)}`);
}

// generateMinutesDocx (linhas 88-89)
const blob = await Packer.toBlob(doc);  // ⚠️ SEM TRY-CATCH!
return blob;
```

**Problema:** `generateMinutesDocx` não tem tratamento de erro

---

### 2. **Uso de `doc.addSection()` - API INCORRETA**

**Localização:** `docxGenerator.ts` (linhas 7, 65)

```typescript
const doc = new Document();
doc.addSection({ children: [...] });  // ⚠️ MÉTODO NÃO EXISTE!
```

**Problema:** A biblioteca `docx` não tem método `addSection()`.

**API Correta:**
```typescript
const doc = new Document({
  sections: [{
    children: [...]
  }]
});
```

**Evidência:** Commit recente menciona "fix(docx): use top-level docx imports"

---

### 3. **Função de Teste Presente**

**Localização:** `ReportsPage.tsx` (linhas 194-227)

```typescript
// DEBUG: generate a minimal DOCX to isolate runtime/library issues
const handleTestMinimalDocx = async () => {
  // ...
}
```

**Indicação:** Sistema tem problemas conhecidos que requerem teste isolado

---

### 4. **Múltiplos Pontos de Chamada**

**Consumidores de `generateStudentDocx`:**
1. `handleDownloadDocx()` - linha 132
2. `handleDownloadReportDocx()` - linha 156
3. `handleDownloadDocxFor()` - linha 178
4. `handleTestMinimalDocx()` - linha 211

**Consumidores de `generateMinutesDocx`:**
1. `handleDownloadMinutesDocx()` - linha 95

**Problema:** Lógica duplicada, difícil de manter

---

## 🎯 Diagnóstico: Root Cause

### Causa Raiz: **API INCORRETA**

A biblioteca `docx` (v9.1.0) usa a seguinte API:

```typescript
// ❌ ERRADO (código atual)
const doc = new Document();
doc.addSection({ children: [...] });

// ✅ CORRETO
const doc = new Document({
  sections: [{
    properties: {},
    children: [...]
  }]
});
```

**Referência:** [docx documentation](https://docx.js.org/)

---

## 📊 Impacto

| Função | Status | Erro Esperado |
|--------|--------|---------------|
| `generateStudentDocx` | 🔴 Quebrado | `doc.addSection is not a function` |
| `generateMinutesDocx` | 🔴 Quebrado | `doc.addSection is not a function` |

---

## 🔧 Plano de Correção

### Fase 1: Validar Biblioteca (Minimal Test)

**Objetivo:** Confirmar que a biblioteca `docx` funciona

**Ação:**
```typescript
// Criar documento mínimo válido
const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ children: [new TextRun("Teste")] })
    ]
  }]
});
const blob = await Packer.toBlob(doc);
// Verificar se blob é válido
```

**Resultado Esperado:** Blob válido, download funciona

---

### Fase 2: Corrigir `generateStudentDocx`

**Mudanças:**
1. Substituir `doc.addSection()` por `new Document({ sections: [...] })`
2. Manter try-catch
3. Testar com dados reais

**Commit:** `fix(docx): correct Document API for student reports`

---

### Fase 3: Corrigir `generateMinutesDocx`

**Mudanças:**
1. Substituir `doc.addSection()` por `new Document({ sections: [...] })`
2. Adicionar try-catch
3. Testar com dados reais

**Commit:** `fix(docx): correct Document API for council minutes`

---

### Fase 4: Remover Código de Debug

**Mudanças:**
1. Remover `handleTestMinimalDocx` de `ReportsPage.tsx`
2. Remover botão de teste da UI

**Commit:** `chore(docx): remove debug test function`

---

### Fase 5: Consolidar Lógica de Download

**Mudanças:**
1. Criar função helper `downloadBlob(blob, filename)`
2. Eliminar duplicação em `ReportsPage.tsx`

**Commit:** `refactor(docx): consolidate download logic`

---

## 🧪 Estratégia de Teste

### Teste 1: Minimal DOCX
```typescript
const doc = new Document({
  sections: [{
    children: [new Paragraph("Hello World")]
  }]
});
const blob = await Packer.toBlob(doc);
// Deve gerar arquivo válido
```

### Teste 2: Student Report
```typescript
const student = { /* dados reais */ };
const blob = await generateStudentDocx(student, classData, {});
// Deve gerar relatório completo
```

### Teste 3: Minutes
```typescript
const blob = await generateMinutesDocx(classData, "notas", "melhorias", [], []);
// Deve gerar ata completa
```

---

## ⚠️ Riscos

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Biblioteca incompatível | Baixa | Versão 9.1.0 é estável |
| Blob handling no browser | Baixa | Código PDF funciona |
| Encoding issues | Média | Testar caracteres PT-BR |
| Table rendering | Média | Simplificar se necessário |

---

## 📝 Checklist de Implementação

### Fase 1: Minimal Test
- [ ] Criar função de teste mínimo
- [ ] Validar blob gerado
- [ ] Confirmar download funciona
- [ ] Abrir arquivo no Word/LibreOffice

### Fase 2: Student Report
- [ ] Corrigir API do Document
- [ ] Testar com dados reais
- [ ] Validar PAEE aparece
- [ ] Validar tabela de disciplinas
- [ ] Commit

### Fase 3: Minutes
- [ ] Corrigir API do Document
- [ ] Adicionar try-catch
- [ ] Testar com dados reais
- [ ] Validar listas (best/attention)
- [ ] Commit

### Fase 4: Cleanup
- [ ] Remover código de debug
- [ ] Commit

### Fase 5: Refactor (Opcional)
- [ ] Consolidar lógica de download
- [ ] Commit

---

## 🎯 Critérios de Sucesso

✅ **Sucesso Mínimo:**
- DOCX de student report baixa e abre no Word
- DOCX de minutes baixa e abre no Word

✅ **Sucesso Completo:**
- Conteúdo completo e formatado
- Tabelas renderizam corretamente
- Caracteres PT-BR (ã, ç, etc.) funcionam
- PAEE flag aparece
- Sem erros no console

✅ **Sucesso Ideal:**
- Código limpo e sem duplicação
- Error handling robusto
- Documentação clara

---

**Diagnóstico concluído por:** DOCX Generation Agent  
**Próximo passo:** Implementar Fase 1 (Minimal Test)
