/**
 * Shared CSV export utility for YF Consultoria
 */

/**
 * Converts an array of objects to a CSV string and triggers download.
 * @param data - Array of records
 * @param columns - Column definitions: { key, label, format? }
 * @param filename - File name without extension
 */
export function downloadCSV(
    data: any[],
    columns: { key: string; label: string; format?: (val: any, row?: any) => string }[],
    filename: string
) {
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility

    const header = columns.map(c => `"${c.label}"`).join(',');

    const rows = data.map(row =>
        columns.map(col => {
            const rawVal = row[col.key];
            const formatted = col.format ? col.format(rawVal, row) : (rawVal ?? '');
            // Wrap in quotes and escape internal quotes
            return `"${String(formatted).replace(/"/g, '""')}"`;
        }).join(',')
    );

    const csvContent = BOM + [header, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
