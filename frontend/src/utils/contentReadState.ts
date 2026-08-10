import { studentIdentifiers } from './recipientTargeting';

export type ContentCategory = 'recordings' | 'materials' | 'sessions' | 'doubts';

const storageKey = (student: any, category: ContentCategory) => 
  `student_read_${category}_${studentIdentifiers(student)[0] || 'unknown'}`;

export const readIdsForCategory = (student: any, category: ContentCategory): string[] => {
  try {
    const stored = localStorage.getItem(storageKey(student, category));
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveReadIds = (student: any, category: ContentCategory, ids: string[]) => {
  const existingIds = readIdsForCategory(student, category);
  const nextIds = [...new Set(ids)];
  if (nextIds.length === existingIds.length && nextIds.every(id => existingIds.includes(id))) return;
  localStorage.setItem(storageKey(student, category), JSON.stringify(nextIds));
  window.dispatchEvent(new Event(`student_${category}_read_updated`));
};

export const isContentRead = (itemId: string, student: any, category: ContentCategory) => {
  if (!itemId) return true;
  return readIdsForCategory(student, category).includes(itemId);
};

export const markContentRead = (itemIds: string[], student: any, category: ContentCategory) => {
  const ids = itemIds.filter(Boolean);
  if (ids.length) {
    saveReadIds(student, category, [...readIdsForCategory(student, category), ...ids]);
  }
};
