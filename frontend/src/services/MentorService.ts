import { collection, doc, documentId, getDoc, onSnapshot, query, setDoc, serverTimestamp, where, type Unsubscribe } from 'firebase/firestore';
import appConfig from '../config/appConfig';
import { auth, db } from '../config/firebase';

export interface MentorRecord {
  id: string; uid: string | null; email: string; name: string; phone: string;
  photoURL: string; designation: string; assignedBatchIds: string[];
  assignedCourseIds: string[];
  status: 'active' | 'disabled'; createdAt?: string; updatedAt?: string;
}

export const mentorDocumentId = (email: string) => email.trim().toLowerCase();

async function mentorHeaders() {
  if (!auth.currentUser) throw new Error('Not authenticated');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${await auth.currentUser.getIdToken()}` };
}

export const MentorService = {
  async authorizeEmail(email: string) {
    const response = await fetch(`${appConfig.apiUrl}/users/mentor/authorize-email`, {
      method: 'POST', headers: await mentorHeaders(), body: JSON.stringify({ email }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || 'Unable to authorize mentor email.');
    return payload;
  },
  async validateSession(): Promise<MentorRecord> {
    const response = await fetch(`${appConfig.apiUrl}/users/mentor/session`, { method: 'POST', headers: await mentorHeaders() });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || 'This Google account is not authorized as a mentor. Please contact the administrator.');
    return payload.data;
  },
  subscribeAdmin(callback: (mentors: MentorRecord[]) => void, onError: (error: Error) => void): Unsubscribe {
    return onSnapshot(collection(db, 'mentors'), snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as MentorRecord))), onError);
  },
  subscribeMine(email: string, callback: (mentor: MentorRecord | null) => void, onError: (error: Error) => void): Unsubscribe {
    return onSnapshot(doc(db, 'mentors', mentorDocumentId(email)), snap => callback(snap.exists() ? { id: snap.id, ...snap.data() } as MentorRecord : null), onError);
  },
  subscribeAssignedBatches(mentor: MentorRecord, callback: (batches: any[]) => void, onError: (error: Error) => void): Unsubscribe {
    const ids = mentor.assignedBatchIds || [];
    if (!ids.length) { callback([]); return () => undefined; }
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
    const results = new Map<string, any>();
    const unsubscribers: Unsubscribe[] = [];
    const emit = () => callback(Array.from(results.values()));
    for (const chunk of chunks) {
      const q = query(collection(db, 'batches'), where(documentId(), 'in', chunk));
      unsubscribers.push(onSnapshot(q, snap => {
        snap.docs.forEach(d => results.set(d.id, { id: d.id, ...d.data() }));
        emit();
      }, onError));
    }
    return () => unsubscribers.forEach(u => u());
  },
  subscribeMyCourses(mentor: MentorRecord, callback: (courses: any[]) => void, onError: (error: Error) => void): Unsubscribe {
    // Two sources merged:
    // A) Courses derived from assigned batches (batch.course = course name string)
    // B) Courses explicitly assigned by admin via assignedCourseIds (course document IDs)
    const mergedResults = new Map<string, any>();
    const emit = () => callback(Array.from(mergedResults.values()));
    const allUnsubscribers: Unsubscribe[] = [];

    // Source A: batch-derived courses via batch.course name field
    const batchIds = mentor.assignedBatchIds || [];
    if (batchIds.length > 0) {
      const batchChunks: string[][] = [];
      for (let i = 0; i < batchIds.length; i += 10) batchChunks.push(batchIds.slice(i, i + 10));
      
      // Track current course-name unsubscribers so we can rebuild when batches change
      let courseNameUnsubs: Unsubscribe[] = [];
      
      const rebuildCourseNameListeners = (courseNames: string[]) => {
        courseNameUnsubs.forEach(u => u());
        courseNameUnsubs = [];
        // Remove all batch-derived keys before re-querying
        Array.from(mergedResults.keys()).filter(k => k.startsWith('batch:')).forEach(k => mergedResults.delete(k));
        if (!courseNames.length) { emit(); return; }
        const nameChunks: string[][] = [];
        for (let i = 0; i < courseNames.length; i += 10) nameChunks.push(courseNames.slice(i, i + 10));
        nameChunks.forEach(chunk => {
          const q = query(collection(db, 'courses'), where('name', 'in', chunk));
          const unsub = onSnapshot(q, snap => {
            snap.docs.forEach(d => mergedResults.set('batch:' + d.id, { id: d.id, ...d.data() }));
            emit();
          }, onError);
          courseNameUnsubs.push(unsub);
        });
      };
      allUnsubscribers.push(() => courseNameUnsubs.forEach(u => u()));

      // Subscribe to batch docs to get their .course name field
      const batchResults = new Map<string, any>();
      batchChunks.forEach(chunk => {
        const q = query(collection(db, 'batches'), where(documentId(), 'in', chunk));
        const unsub = onSnapshot(q, snap => {
          snap.docs.forEach(d => batchResults.set(d.id, d.data()));
          // Collect unique, non-empty course names across all fetched batches
          const courseNames = [...new Set(
            Array.from(batchResults.values())
              .map(b => (b.course || '').trim())
              .filter(Boolean)
          )];
          rebuildCourseNameListeners(courseNames);
        }, onError);
        allUnsubscribers.push(unsub);
      });
    }

    // Source B: explicitly assigned course IDs
    const ids = mentor.assignedCourseIds || [];
    if (ids.length > 0) {
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
      chunks.forEach(chunk => {
        const q = query(collection(db, 'courses'), where(documentId(), 'in', chunk));
        allUnsubscribers.push(onSnapshot(q, snap => {
          snap.docs.forEach(d => mergedResults.set('explicit:' + d.id, { id: d.id, ...d.data() }));
          emit();
        }, onError));
      });
    }

    // If mentor has neither batches nor explicit courses, emit empty immediately
    if (!batchIds.length && !ids.length) { callback([]); }

    return () => allUnsubscribers.forEach(u => u());
  },
  async getBatch(batchId: string) {
    const snap = await getDoc(doc(db, 'batches', batchId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },
  async saveAdmin(record: Partial<MentorRecord> & { email: string }) {
    const id = mentorDocumentId(record.email);
    const existing = await getDoc(doc(db, 'mentors', id));
    await setDoc(doc(db, 'mentors', id), {
      ...record, email: id, uid: existing.exists() ? existing.data().uid || null : null,
      assignedBatchIds: record.assignedBatchIds || [],
      assignedCourseIds: record.assignedCourseIds || [],
      status: record.status || 'active', updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    }, { merge: true });
  },
};
