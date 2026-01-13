# Instruções para Aplicar Correções no Navegador

## ⚠️ IMPORTANTE: Hot Reload pode não funcionar para utilitários

O Vite faz **Hot Module Replacement (HMR)** automático, mas mudanças em arquivos utilitários como `studentProcessor.ts` **podem não ser aplicadas** sem um reload completo.

---

## ✅ Como Garantir que as Correções Estão Ativas

### Opção 1: Hard Reload no Navegador (RECOMENDADO)

1. **Abrir o navegador** em `http://localhost:5173`
2. **Pressionar:**
   - **Windows/Linux:** `Ctrl + Shift + R` ou `Ctrl + F5`
   - **Mac:** `Cmd + Shift + R`
3. **Aguardar** página recarregar completamente
4. **Verificar** se logs aparecem no console

---

### Opção 2: Limpar Cache e Recarregar

1. **Abrir DevTools:** `F12`
2. **Clicar com botão direito** no ícone de reload
3. **Selecionar:** "Esvaziar cache e recarregar forçadamente"
4. **Aguardar** página recarregar
5. **Verificar** logs no console

---

### Opção 3: Reiniciar Servidor (se necessário)

Se as opções acima não funcionarem:

1. **No terminal** onde `npm run dev` está rodando:
   - Pressionar `Ctrl + C`
   - Confirmar com `Y` se solicitado
2. **Iniciar novamente:**
   ```bash
   npm run dev
   ```
3. **Aguardar** servidor iniciar
4. **Recarregar** navegador

---

## 🔍 Como Verificar se as Correções Estão Ativas

### Passo 1: Abrir Console
- Pressionar `F12`
- Ir para aba "Console"
- Limpar console (ícone 🚫)

### Passo 2: Importar Mapão
- Ir para página "Alunos"
- Fazer upload do Excel
- Importar

### Passo 3: Procurar por Novos Logs
Se as correções estiverem ativas, você verá logs como:

```
[studentProcessor] Colunas detectadas: freqCol=X, freqAnCol=Y, ...
[studentProcessor] Coluna Fre An(%) detectada no índice Y: header="...", sub="..."
[studentProcessor] Aluno "AMANDA": Lendo Fre An(%) da coluna Y, valor bruto="96%"
[studentProcessor] Aluno "AMANDA": Fre An(%) convertido = 96%
```

**Se NÃO ver esses logs** → Correções não estão ativas → Fazer hard reload

---

## ✅ Confirmação Visual

Após reload completo, ao importar o Mapão:
- ✅ Console deve mostrar logs detalhados
- ✅ Logs devem mencionar "Fre An(%)"
- ✅ Logs devem mostrar valores brutos das células

**Se não ver logs** → Fazer Opção 3 (reiniciar servidor)

---

**Criado em:** 2026-01-12 18:20
