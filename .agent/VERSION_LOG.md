# Version Log - Bom Conselho

## v1.0.0 (2026-01-12) - Production Release
**Tag:** `v1.0.0`
**Commit:** `9ee704a`

### 🚀 Principais Features
- **Gestão Acadêmica:** Importação de Mapão, Análise de Frequência e Notas.
- **Relatórios:** Student Report e Ata de Conselho (PDF e DOCX).
- **Conselho de Classe:** Detecção automática de alunos PAEE, cálculo de faltas anuais.
- **Segurança:** Autenticação básica (admin/admin), sessão de 24h.

### 🔧 Melhorias Técnicas
- **Data Integrity:** Correção robusta de parsing de faltas anuais ("Fre An(%)").
- **Layout:** Otimização para impressão (redução de 20-30% de páginas).
- **Estabilidade:** DOCX generation corrigido, logs detalhados.
- **Configuração:** `.env.example` adicionado, documentação completa.

### ⚠️ Notas de Produção
- **Persistência:** `localStorage` (dados locais apenas).
- **Backup:** Não há backup automático na nuvem nesta versão.
- **Autenticação:** Usuário único padrão.

---

**Próximos Passos (v1.1.0 Planejado):**
- Integração completa com Supabase.
- Gestão de múltiplos usuários.
- Backup e sincronização em nuvem.
