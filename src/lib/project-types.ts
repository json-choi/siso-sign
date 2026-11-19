export const PROJECT_TYPES = ['commercial', 'retail'] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  commercial: 'Commercial Project',
  retail: 'Retail Project',
};

export function isProjectType(value: unknown): value is ProjectType {
  return typeof value === 'string' && (PROJECT_TYPES as readonly string[]).includes(value);
}

/** Normalizes a stored value, so rows read before the column existed count as unclassified. */
export function toProjectType(value: unknown): ProjectType | null {
  return isProjectType(value) ? value : null;
}
