
export enum ColumnType {
    Unknown = 0,
    StudentName,
    StudentStatus,
    TotalAbsences,        // TF
    PeriodAttendance,     // Fre(%)
    AnnualAbsences,       // FT An
    AnnualAttendance,     // Fre An(%)
    PAEE,
    DisciplineName,
    Total
}

export const normalizeHeader = (text: string): string => {
    return String(text || '')
        .trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .toUpperCase()
        .replace(/\s+/g, ' '); // Collapse spaces
};

export const identifyColumn = (header: string, sub: string): ColumnType => {
    const h = normalizeHeader(header);
    const s = normalizeHeader(sub);
    const combined = `${h} ${s}`.trim();

    // Explicit Exact Matches from Mapão Analysis
    // Row 11: "Fre An(%)" -> FRE AN(%)
    if (s.includes('FRE AN(%)') || s.includes('FRE AN (%)')) return ColumnType.AnnualAttendance;
    if (combined.includes('FRE AN(%)') || combined.includes('FRE AN (%)')) return ColumnType.AnnualAttendance;

    // Row 11: "Fre(%)" -> FRE(%)
    // Needs to be distinct from Fre An(%)
    if ((s.includes('FRE(%)') || s.includes('FRE (%)')) && !s.includes('AN')) return ColumnType.PeriodAttendance;

    // TF / Total Faltas
    if (s === 'TF' || h === 'TF' || combined.includes('TOTAL FALTAS')) return ColumnType.TotalAbsences;

    // FT An / Faltas Anuais
    if (s === 'FT AN' || s === 'FTAN' || combined.includes('FALTAS ANUAIS')) return ColumnType.AnnualAbsences;

    // Generic Fallbacks (Regex)
    if (combined.match(/FRE.*ANUAL/)) return ColumnType.AnnualAttendance;
    if (combined.match(/FRE.*AN\b/)) return ColumnType.AnnualAttendance;

    // PAEE
    if (combined.includes('PAEE') || combined.includes('PUBLICO ALVO')) return ColumnType.PAEE;

    // Student Info
    if (h === 'ALUNO' || h.includes('NOME DO ALUNO')) return ColumnType.StudentName;
    if (h === 'SITUACAO' || h === 'STATUS') return ColumnType.StudentStatus;

    return ColumnType.Unknown;
};
