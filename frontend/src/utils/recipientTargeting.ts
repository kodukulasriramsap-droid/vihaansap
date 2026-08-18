/** Backward-compatible recipient targeting for batch content. */
export type RecipientTarget = {
  recipientType?: 'all' | 'selected' | 'excluded';
  recipientMode?: 'all' | 'selected' | 'excluded'; // legacy field
  recipientIds?: string[];
  excludedStudentIds?: string[];
  visibilitySettings?: { mode?: string; studentIds?: string[] };
  batchId?: string;
  uploadDate?: string;
  createdAt?: string;
  date?: string;
};

export const studentIdentifiers = (student: any) =>
  [student?.id, student?.uid, student?.studentId].filter(Boolean) as string[];

export const isTargetedToStudent = (item: RecipientTarget, student: any) => {
  const recipientType = item.recipientType || item.recipientMode;
  
  if (recipientType === 'selected') {
    const recipients = item.recipientIds || item.visibilitySettings?.studentIds || [];
    return studentIdentifiers(student).some(id => recipients.includes(id));
  }
  if (item.visibilitySettings?.mode === 'Selected') {
    return studentIdentifiers(student).some(id => (item.visibilitySettings?.studentIds || []).includes(id));
  }
  
  if (recipientType === 'excluded') {
    const excludedIds = item.excludedStudentIds || [];
    if (studentIdentifiers(student).some(id => excludedIds.includes(id))) {
      return false; // Student is excluded
    }
  }

  // Historical Grant Logic for 'all' mode
  const batchId = item.batchId;
  const contentDate = item.uploadDate || item.createdAt || item.date || '';
  
  const hasGrant = batchId && student?.grantedHistoricalBatches?.includes(batchId);
  const joinDate = (batchId && student?.batchJoinDates && student?.batchJoinDates[batchId]) || '';
  
  // Safe prefix comparison (YYYY-MM-DD)
  const safeJoinDate = joinDate.substring(0, 10);
  const safeContentDate = contentDate.substring(0, 10);

  // If legacy (no join date recorded), or explicitly granted, or content is newer than join date
  if (safeJoinDate === '' || hasGrant || (safeContentDate && safeContentDate >= safeJoinDate)) {
      return true;
  }
  
  return false;
};

export const enrolledStudentsForBatch = (batch: any, students: any[]) =>
  (students || []).filter(student =>
    studentIdentifiers(student).some(id => (batch?.studentIds || []).includes(id)) || student.batch === batch?.name
  );
