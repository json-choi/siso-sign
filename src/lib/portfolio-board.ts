import { PROJECT_TYPES, toProjectType } from '@/lib/project-types';
import type { ProjectType } from '@/lib/project-types';
import type { Portfolio, PortfolioPlacement } from '@/types/database';

export type ColumnId = ProjectType | 'unclassified';
export type Columns = Record<ColumnId, string[]>;

export const COLUMN_IDS: readonly ColumnId[] = [...PROJECT_TYPES, 'unclassified'];

export function columnType(column: ColumnId): ProjectType | null {
  return column === 'unclassified' ? null : column;
}

export function isColumnId(value: unknown): value is ColumnId {
  return typeof value === 'string' && (COLUMN_IDS as readonly string[]).includes(value);
}

/** Groups portfolios by project type, keeping each group in sort order. */
export function groupPortfolios(portfolios: Portfolio[]): Columns {
  const columns: Columns = { commercial: [], retail: [], unclassified: [] };
  const sorted = [...portfolios].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
  for (const item of sorted) {
    columns[toProjectType(item.project_type) ?? 'unclassified'].push(item.id);
  }
  return columns;
}

export function findColumn(columns: Columns, id: string): ColumnId | null {
  if (isColumnId(id)) return id;
  return COLUMN_IDS.find((column) => columns[column].includes(id)) ?? null;
}

/** Moves an item to a column at an index (end when omitted), returning new columns. */
export function moveItem(columns: Columns, id: string, to: ColumnId, index?: number): Columns {
  const from = findColumn(columns, id);
  if (!from) return columns;
  const next: Columns = { commercial: [...columns.commercial], retail: [...columns.retail], unclassified: [...columns.unclassified] };
  next[from] = next[from].filter((item) => item !== id);
  const target = next[to];
  const position = index === undefined ? target.length : Math.max(0, Math.min(index, target.length));
  target.splice(position, 0, id);
  return next;
}

/** Placements for items whose type or position changed. Positions are indexes within each column. */
export function changedPlacements(columns: Columns, portfolios: Map<string, Portfolio>): PortfolioPlacement[] {
  const changes: PortfolioPlacement[] = [];
  for (const column of COLUMN_IDS) {
    columns[column].forEach((id, index) => {
      const item = portfolios.get(id);
      const projectType = columnType(column);
      if (item && (toProjectType(item.project_type) !== projectType || item.sort_order !== index)) {
        changes.push({ id, project_type: projectType, sort_order: index });
      }
    });
  }
  return changes;
}
