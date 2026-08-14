export const formatSafeDate = (value: any): string => {
  if (!value) return 'Just now';

  // Handle Firestore Timestamp objects directly (with _seconds or seconds)
  if (typeof value === 'object') {
    if (value._seconds) {
      return new Date(value._seconds * 1000).toLocaleDateString('en-GB');
    }
    if (value.seconds) {
      return new Date(value.seconds * 1000).toLocaleDateString('en-GB');
    }
    // Handle JS Date object
    if (value instanceof Date) {
      return value.toLocaleDateString('en-GB');
    }
    // Handle Firestore Timestamp `toDate` method if present
    if (typeof value.toDate === 'function') {
      return value.toDate().toLocaleDateString('en-GB');
    }
  }

  // Handle number (milliseconds) or string dates
  if (typeof value === 'number' || typeof value === 'string') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB');
    }
  }

  return 'Just now';
};
