export type DiffKind = 'same' | 'add' | 'del';

export interface DiffLine {
  kind: DiffKind;
  text: string;
}

const MAX_LINES = 400;

export const diffLines = (left: string, right: string): DiffLine[] => {
  const a = left.split('\n').slice(0, MAX_LINES);
  const b = right.split('\n').slice(0, MAX_LINES);
  const rows = a.length;
  const cols = b.length;

  const table: number[][] = Array.from({ length: rows + 1 }, () =>
    new Array<number>(cols + 1).fill(0),
  );
  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      table[i][j] =
        a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < rows && j < cols) {
    if (a[i] === b[j]) {
      result.push({ kind: 'same', text: a[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      result.push({ kind: 'del', text: a[i] });
      i += 1;
    } else {
      result.push({ kind: 'add', text: b[j] });
      j += 1;
    }
  }
  while (i < rows) {
    result.push({ kind: 'del', text: a[i] });
    i += 1;
  }
  while (j < cols) {
    result.push({ kind: 'add', text: b[j] });
    j += 1;
  }
  return result;
};

export const diffStats = (lines: DiffLine[]): { added: number; removed: number } => ({
  added: lines.filter((line) => line.kind === 'add').length,
  removed: lines.filter((line) => line.kind === 'del').length,
});
