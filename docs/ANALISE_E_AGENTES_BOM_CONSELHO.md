# Análise do sistema Bom Conselho e proposta de agentes especializados

## 1) Leitura rápida da arquitetura atual

Com base no código atual, o Bom Conselho já possui um fluxo funcional de ponta a ponta para o cenário MVP:

- Importação de planilhas (CSV/XLS/XLSX) pela tela inicial.
- Processamento dos dados de alunos e turma em utilitários locais.
- Persistência local em contexto + localStorage.
- Geração de relatórios e atas no front-end (PDF/DOCX).
- Autenticação em modo simples/local para uso demonstrativo.

### Evidências de implementação

- Fluxo de upload e processamento na página inicial (`processMapaoFile`, `setStudents`, `setClassData`).
- Contexto de estudantes com estado centralizado no cliente.
- Utilitários específicos de processamento em `src/utils/fileProcessor`.
- Geração de documentos em `src/utils/pdfGenerator.ts` e `src/utils/docxGenerator.ts`.

## 2) Oportunidades para produto monetizável

Para transformar em produto SaaS vendável para escolas e redes, os principais eixos são:

1. **Confiabilidade operacional**
   - Logs de processamento por arquivo.
   - Métricas de erro por tipo de planilha.
   - Versão de parser por layout de origem.

2. **Governança e conformidade**
   - Perfis de acesso (gestão, coordenação, professor).
   - Auditoria de geração/edição de relatórios.
   - Camada LGPD (consentimento, retenção, descarte).

3. **Escalabilidade comercial**
   - Multi-escola / multi-unidade.
   - Assinatura por número de turmas/alunos.
   - Relatórios executivos para direção e mantenedora.

4. **Inteligência pedagógica assistida**
   - Recomendações de intervenção por padrão de notas.
   - Alertas de risco (evasão, queda de desempenho, frequência).
   - Sumários automáticos para reuniões de conselho.

## 3) Conjunto de agentes especializados propostos

Os agentes abaixo foram desenhados para atuar sobre o contexto atual do sistema, acelerando evolução técnica e valor de negócio.

### Agente 1 — Ingestão e Qualidade de Dados

- **Objetivo:** aumentar taxa de sucesso de importação de mapões sem intervenção manual.
- **Entradas:** arquivo bruto, metadados da turma, histórico de erros.
- **Saídas:** dataset normalizado + relatório de inconsistências.
- **KPIs:** taxa de importação bem-sucedida, tempo de correção, taxa de retrabalho.
- **Ações sugeridas no produto:** histórico de uploads, validação pré-processamento e checklist automático.

### Agente 2 — Diagnóstico Pedagógico

- **Objetivo:** priorizar alunos por criticidade e sugerir encaminhamentos.
- **Entradas:** notas, frequência, observações comportamentais.
- **Saídas:** ranking de risco pedagógico e recomendações estruturadas.
- **KPIs:** redução de reprovação, redução de alunos sem plano de ação.
- **Ações sugeridas no produto:** painel de risco, filtros por disciplina e série, templates de plano de intervenção.

### Agente 3 — Copiloto de Documentos Oficiais

- **Objetivo:** gerar atas/relatórios mais consistentes e auditáveis.
- **Entradas:** dados de conselho, decisões por aluno, modelo institucional.
- **Saídas:** ata final, relatórios individuais, trilha de alterações.
- **KPIs:** tempo para fechar conselho, taxa de revisão manual, padronização textual.
- **Ações sugeridas no produto:** versionamento de documentos, bloqueio pós-aprovação e assinatura digital futura.

### Agente 4 — Governança e LGPD Escolar

- **Objetivo:** manter conformidade e reduzir risco jurídico.
- **Entradas:** eventos do sistema, dados pessoais, políticas de retenção.
- **Saídas:** alertas de conformidade, rotinas de anonimização e descarte.
- **KPIs:** incidentes de acesso indevido, aderência de retenção, tempo de resposta a solicitações.
- **Ações sugeridas no produto:** trilha de auditoria, permissões por papel e relatórios de compliance.

### Agente 5 — Monetização e Sucesso do Cliente

- **Objetivo:** converter valor pedagógico em receita recorrente previsível.
- **Entradas:** uso por escola, adoção por perfil, volume de turmas e geração de documentos.
- **Saídas:** score de saúde da conta, gatilhos de upsell e risco de churn.
- **KPIs:** MRR, churn, expansão por conta, ativação de funcionalidades-chave.
- **Ações sugeridas no produto:** dashboard comercial, plano por faixas de alunos e onboarding guiado.

## 4) Roadmap recomendado (90 dias)

### Fase 1 (0–30 dias) — Base de produto
- Instrumentar logs de importação e erros.
- Criar área de administração simples (escola/turma/perfil).
- Padronizar payload de geração de documentos.

### Fase 2 (31–60 dias) — Inteligência operacional
- Entregar painel de risco pedagógico inicial.
- Criar pipeline de versões de parser de mapão.
- Implementar eventos para auditoria e conformidade.

### Fase 3 (61–90 dias) — Comercialização
- Lançar planos (Básico, Profissional, Rede).
- Entregar métricas de valor para gestores.
- Estruturar playbook de implantação em novas escolas.

## 5) Modelo de monetização sugerido

- **Plano Básico:** importação + relatórios essenciais por turma.
- **Plano Profissional:** painel de risco + personalização de modelos + histórico.
- **Plano Rede:** multiunidade, auditoria completa, SSO e suporte prioritário.

Preço pode ser por faixa de alunos ativos/mês com adicional por unidade escolar.

## 6) Próximo passo técnico imediato

Criar uma camada de orquestração de agentes com prompts e responsabilidades claras (definida no diretório `agents/`) para guiar desenvolvimento e futuras integrações de IA.
