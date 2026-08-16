import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  documentId,
} from 'firebase/firestore';
import { auth } from '../config/firebase';
import { isAdminEmail } from '../config/adminConfig';
import { db } from '../config/firebase';
import { DatabaseSchema } from '../lib/mockdb/schema';
import { MockDB } from './MockDB';

// List of all collections that need to be synced between MockDB and Firestore.
// 'students' is handled via FirestoreStudentService specifically in AuthContext,
// but we can safely include it here or let it be handled separately. We'll handle
// everything generically here.
const COLLECTIONS_TO_SYNC: (keyof DatabaseSchema)[] = [
  'courses',
  'batches',
  'students',
  'mentors',
  'batchPlanner',
  'batchSessions',
  'liveClasses',
  'studyMaterials',
  'sessionFeedback',
  'courseRatings',
  'blogs',
  'reviews',
  'reviewCampaigns',
  'faqs',
  'schedules',
  'recordings',
  'assignments',
  'payments',
  'doubts',
  'doubtReplies',
  'notifications',
  'events',
  'leads',
  'serverEnquiries',
  'accounts',
  'serverPayments',
];

export class FirestoreDBService {
  private static unsubscribers: (() => void)[] = [];

  /**
   * Initializes real-time listeners for all collections.
   * Keeps MockDB (the synchronous in-memory store) completely up to date.
   */
  static async subscribeToAll(role: 'admin' | 'mentor' | 'student' = 'student'): Promise<void> {
    if (!db || !auth.currentUser) {
      console.warn('[FirestoreDBService] Firestore or Auth not configured/ready.');
      return;
    }

    const user = auth.currentUser;
    const isAdmin = role === 'admin' || isAdminEmail(user.email);
    const isMentor = role === 'mentor';

    // Clean up any existing listeners
    this.unsubscribeAll();

    // 1. If user is a student or mentor, we must securely fetch their assigned/enrolled batches.
    if (!isAdmin) {
      const BATCH_DEPENDENT_COLLECTIONS = ['batchPlanner', 'batchSessions', 'liveClasses', 'schedules', 'assignments'];
      const TARGETED_COLLECTIONS = ['studyMaterials', 'recordings'];
      
      let dependentUnsubscribers: (() => void)[] = [];
      const updateDependentSubscriptions = (myBatchIds: string[]) => {
        dependentUnsubscribers.forEach(u => u());
        dependentUnsubscribers = [];

        if (myBatchIds.length > 0) {
          const chunkedBatchIds = [];
          for (let i = 0; i < myBatchIds.length; i += 5) {
            chunkedBatchIds.push(myBatchIds.slice(i, i + 5));
          }
          
          for (const colName of BATCH_DEPENDENT_COLLECTIONS) {
            for (const chunk of chunkedBatchIds) {
              const q = query(collection(db, colName), where('batchId', 'in', chunk));
              const unsub = onSnapshot(q, (snapshot) => {
                const firestoreData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                const currentDb = MockDB.get();
                (currentDb[colName] as any[]) = firestoreData;
                MockDB.set(currentDb);
              }, (err) => console.error(`[FirestoreDBService] Error syncing dependent ${colName}:`, err));
              dependentUnsubscribers.push(unsub);
            }
          }

          for (const colName of TARGETED_COLLECTIONS) {
            for (const chunk of chunkedBatchIds) {
              const colRef = collection(db, colName);
              
              if (isMentor) {
                // Mentors can see ALL targeted content in their assigned batches
                const q = query(colRef, where('batchId', 'in', chunk));
                const unsub = onSnapshot(q, (snapshot) => {
                  const firestoreData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                  const currentDb = MockDB.get();
                  (currentDb[colName as 'studyMaterials' | 'recordings'] as any[]) = firestoreData;
                  MockDB.set(currentDb);
                }, (err) => console.error(`[FirestoreDBService] Mentor sync error ${colName}:`, err));
                dependentUnsubscribers.push(unsub);
              } else {
                // Student logic: requires merging of visibility rules
                const mergerState = new Map<string, any>();
                const mergeDocs = (docs: any[]) => {
                  docs.forEach(d => mergerState.set(d.id, d));
                  const currentDb = MockDB.get();
                  (currentDb[colName as 'studyMaterials' | 'recordings'] as any[]) = Array.from(mergerState.values());
                  MockDB.set(currentDb);
                };

                const q1 = query(colRef, where('batchId', 'in', chunk), where('recipientMode', '==', 'all'));
                dependentUnsubscribers.push(onSnapshot(q1, snap => mergeDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err => console.error(`Sync error ${colName} Q1:`, err)));

                const q2 = query(colRef, where('batchId', 'in', chunk), where('recipientType', '==', 'all'));
                dependentUnsubscribers.push(onSnapshot(q2, snap => mergeDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err => console.error(`Sync error ${colName} Q2:`, err)));

                const q3 = query(colRef, where('batchId', 'in', chunk), where('recipientIds', 'array-contains', user.uid));
                dependentUnsubscribers.push(onSnapshot(q3, snap => mergeDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err => console.error(`Sync error ${colName} Q3:`, err)));

                const q4 = query(colRef, where('batchId', 'in', chunk), where('visibility', '==', 'Students'));
                dependentUnsubscribers.push(onSnapshot(q4, snap => mergeDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err => console.error(`Sync error ${colName} Q4:`, err)));

                const q5 = query(colRef, where('batchId', 'in', chunk), where('visibility', '==', 'Everyone'));
                dependentUnsubscribers.push(onSnapshot(q5, snap => mergeDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err => console.error(`Sync error ${colName} Q5:`, err)));
              }
            }
          }
        }
      };

      // ── Batch notifications updater ─────────────────────────────────────────
      // Declared here so it is in scope for both the mentor and student branches.
      // Called from the batches onSnapshot, keeping batch-level notification
      // subscriptions reactive to batch membership changes without a second
      // duplicate batches watcher.
      const batchNotifColRef = collection(db, 'notifications');
      let notifBatchUnsubscribers: (() => void)[] = [];
      this.unsubscribers.push(() => notifBatchUnsubscribers.forEach(u => u()));

      const updateBatchNotifications = (myBatchIds: string[]) => {
        notifBatchUnsubscribers.forEach(u => u());
        notifBatchUnsubscribers = [];
        if (myBatchIds.length === 0) return;

        const chunks: string[][] = [];
        for (let i = 0; i < myBatchIds.length; i += 10) chunks.push(myBatchIds.slice(i, i + 10));

        chunks.forEach((chunk, idx) => {
          const qBatchNotif = query(batchNotifColRef, where('targetId', 'in', chunk), where('target', '==', 'Batch'));
          const unsub = onSnapshot(qBatchNotif,
            snap => {
              // updateNotifications is declared below in the !isAdmin notifications block.
              // We defer to MockDB directly here for batch notifications.
              const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              const currentDb = MockDB.get();
              const existingNotifs = (currentDb['notifications'] as any[]) || [];
              const batchNotifIds = new Set(docs.map((d: any) => d.id));
              // Remove old batch notifications for this chunk and add new ones
              const filtered = existingNotifs.filter((n: any) => !(n.target === 'Batch' && chunk.includes(n.targetId)));
              (currentDb['notifications'] as any[]) = [...filtered, ...docs];
              MockDB.set(currentDb);
            },
            err => console.error(`[FirestoreDBService] Error syncing notifications (batch-${idx}):`, err)
          );
          notifBatchUnsubscribers.push(unsub);
        });
      };

      if (isMentor) {

        const { doc } = await import('firebase/firestore');
        const mentorId = user.email ? user.email.trim().toLowerCase() : user.uid;
        const mentorDocRef = doc(db, 'mentors', mentorId);
        
        let batchUnsubscribers: (() => void)[] = [];
        
        const unsubMentor = onSnapshot(mentorDocRef, (mentorDoc) => {
          batchUnsubscribers.forEach(u => u());
          batchUnsubscribers = [];
          
          let myBatchIds: string[] = [];
          if (mentorDoc.exists()) {
            myBatchIds = mentorDoc.data().assignedBatchIds || [];
          }
          
          if (myBatchIds.length > 0) {
            const chunkedBatchIds = [];
            for (let i = 0; i < myBatchIds.length; i += 10) chunkedBatchIds.push(myBatchIds.slice(i, i + 10));
            
            const batchMerger = new Map<string, any>();
            chunkedBatchIds.forEach(chunk => {
              const batchesQuery = query(collection(db, 'batches'), where(documentId(), 'in', chunk));
              const unsub = onSnapshot(batchesQuery, (snapshot) => {
                snapshot.docs.forEach(d => batchMerger.set(d.id, { id: d.id, ...d.data() }));
                const currentDb = MockDB.get();
                (currentDb['batches'] as any[]) = Array.from(batchMerger.values());
                MockDB.set(currentDb);
              });
              batchUnsubscribers.push(unsub);
            });
          } else {
             const currentDb = MockDB.get();
             (currentDb['batches'] as any[]) = [];
             MockDB.set(currentDb);
          }
          
          updateDependentSubscriptions(myBatchIds);
        });
        
        this.unsubscribers.push(unsubMentor);
        this.unsubscribers.push(() => batchUnsubscribers.forEach(u => u()));
        this.unsubscribers.push(() => dependentUnsubscribers.forEach(u => u()));

      } else {
        const batchesQuery = query(collection(db, 'batches'), where('studentIds', 'array-contains', user.uid));
        const unsubBatches = onSnapshot(batchesQuery, (snapshot) => {
          const myBatches = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          const currentDb = MockDB.get();
          (currentDb['batches'] as any[]) = myBatches;
          MockDB.set(currentDb);
          
          const myBatchIds = myBatches.map(b => b.id);
          updateDependentSubscriptions(myBatchIds);
          updateBatchNotifications(myBatchIds);
        });
        
        this.unsubscribers.push(unsubBatches);
        this.unsubscribers.push(() => dependentUnsubscribers.forEach(u => u()));
      }


      // ── Scoped doubts subscription ─────────────────────────────────────────
      const doubtsQuery = isMentor 
        ? query(collection(db, 'doubts')) 
        : query(collection(db, 'doubts'), where('studentId', '==', user.uid));
      const unsubDoubts = onSnapshot(doubtsQuery, (snapshot) => {
        const firestoreData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const currentDb = MockDB.get();
        (currentDb['doubts'] as any[]) = firestoreData;
        MockDB.set(currentDb);
      }, (err) => console.error('[FirestoreDBService] Error syncing doubts:', err));
      this.unsubscribers.push(unsubDoubts);

      // ── Scoped doubtReplies subscription ───────────────────────────────────
      // Rule: allow read if authorId == request.auth.uid OR studentId == request.auth.uid
      // We need two queries to cover both branches, merged by doc ID.
      const replyResults = new Map<string, Map<string, any>>();
      const mergeReplies = (key: string, docs: any[]) => {
        replyResults.set(key, new Map(docs.map(d => [d.id, d])));
        const merged = new Map<string, any>();
        replyResults.forEach(m => m.forEach((v, k) => merged.set(k, v)));
        const currentDb = MockDB.get();
        (currentDb['doubtReplies'] as any[]) = Array.from(merged.values());
        MockDB.set(currentDb);
      };

      // Q1: Replies authored by this student
      const repliesByAuthor = query(collection(db, 'doubtReplies'), where('authorId', '==', user.uid));
      const unsubRepliesAuthor = onSnapshot(repliesByAuthor, (snapshot) => {
        mergeReplies('author', snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => console.error('[FirestoreDBService] Error syncing doubtReplies (author):', err));
      this.unsubscribers.push(unsubRepliesAuthor);

      // Q2: Replies on this student's doubts (e.g. mentor replies)
      // Mentors can read all replies to doubts in their batches, but for simplicity here if isMentor we just query all doubtReplies (rules permitting)
      const repliesByStudent = isMentor
        ? query(collection(db, 'doubtReplies'))
        : query(collection(db, 'doubtReplies'), where('studentId', '==', user.uid));
      const unsubRepliesStudent = onSnapshot(repliesByStudent, (snapshot) => {
        mergeReplies('student', snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => console.error('[FirestoreDBService] Error syncing doubtReplies (student):', err));
      this.unsubscribers.push(unsubRepliesStudent);
    }

    // 2. Students receive only the collections used by their portal. Admins
    // retain the existing full administrative subscriptions.
    const BATCH_DEPENDENT_COLLECTIONS = ['batchPlanner', 'batchSessions', 'liveClasses', 'studyMaterials', 'schedules', 'recordings', 'assignments'];
    const STUDENT_COLLECTIONS = new Set(['reviews', 'reviewCampaigns', 'events', 'courses', 'blogs', 'faqs', 'courseRatings']);
    for (const colName of COLLECTIONS_TO_SYNC) {
      if (!isAdmin && colName === 'batches') continue; // Handled specially above for students
      if (!isAdmin && BATCH_DEPENDENT_COLLECTIONS.includes(colName)) continue; // Handled specially for students
      if (!isAdmin && colName === 'notifications') continue; // Handled specially below
      if (!isAdmin && colName === 'reviewCampaigns') continue; // Handled specially below
      if (!isAdmin && !STUDENT_COLLECTIONS.has(colName)) continue;
      
      const colRef = collection(db, colName as string);
      const unsub = onSnapshot(
        colRef,
        (snapshot) => {
          const firestoreData: any[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));

          const currentDb = MockDB.get();
          (currentDb[colName] as any[]) = firestoreData;
          MockDB.set(currentDb);
        },
        (error) => {
          console.error(`[FirestoreDBService] Error syncing collection ${colName}:`, error);
        }
      );
      this.unsubscribers.push(unsub);
    }

    // ── Notifications: multi-query merge to cover all targeting scenarios ──────
    // Students must see:
    //   1. Notifications explicitly listing their UID in recipientIds
    //   2. Batch-level notifications (target='Batch') for their enrolled batches
    //   3. Global notifications (target='Everyone' or target='Students')
    // reviewCampaigns: only those listing the student's UID
    if (!isAdmin) {
      const notifMerger = new Map<string, any>();
      const updateNotifications = (key: string, docs: any[]) => {
        const existing = notifMerger.get(key) ?? new Map<string, any>();
        docs.forEach(d => existing.set(d.id, d));
        notifMerger.set(key, existing);
        const merged = new Map<string, any>();
        notifMerger.forEach(m => m.forEach((v, k) => merged.set(k, v)));
        const currentDb = MockDB.get();
        (currentDb['notifications'] as any[]) = Array.from(merged.values());
        MockDB.set(currentDb);
      };

      const notifColRef = collection(db, 'notifications');

      // Q-notif-1: Notifications explicitly addressed to this student
      const qNotifDirect = query(notifColRef, where('recipientIds', 'array-contains', user.uid));
      this.unsubscribers.push(onSnapshot(qNotifDirect,
        snap => updateNotifications('direct', snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        err => console.error('[FirestoreDBService] Error syncing notifications (direct):', err)
      ));

      // Q-notif-2: Global notifications for all students
      const qNotifEveryone = query(notifColRef, where('target', '==', 'Everyone'));
      this.unsubscribers.push(onSnapshot(qNotifEveryone,
        snap => updateNotifications('everyone', snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        err => console.error('[FirestoreDBService] Error syncing notifications (everyone):', err)
      ));

      // Q-notif-3: Notifications targeting all students
      const qNotifStudents = query(notifColRef, where('target', '==', 'Students'));
      this.unsubscribers.push(onSnapshot(qNotifStudents,
        snap => updateNotifications('students', snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        err => console.error('[FirestoreDBService] Error syncing notifications (students):', err)
      ));

      // reviewCampaigns: only where student is a recipient
      const rcColRef = collection(db, 'reviewCampaigns');
      const qRC = query(rcColRef, where('recipientIds', 'array-contains', user.uid));
      this.unsubscribers.push(onSnapshot(qRC,
        snap => {
          const currentDb = MockDB.get();
          (currentDb['reviewCampaigns'] as any[]) = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          MockDB.set(currentDb);
        },
        err => console.error('[FirestoreDBService] Error syncing reviewCampaigns:', err)
      ));
    }

    const websiteConfigUnsubscribe = onSnapshot(doc(db, 'config', 'website'), (snapshot) => {
      if (!snapshot.exists()) return;
      const currentDb = MockDB.get();
      currentDb.websiteContent = snapshot.data() as any;
      MockDB.set(currentDb);
    }, (error) => console.error('[FirestoreDBService] Error syncing website settings:', error));
    this.unsubscribers.push(websiteConfigUnsubscribe);
  }

  static unsubscribeAll(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }

  // ─── Generic Write Operations ─────────────────────────────────────────────

  static async upsert(collectionName: keyof DatabaseSchema, id: string, data: any): Promise<void> {
    if (!db) return;
    try {
      const docRef = doc(db, collectionName as string, id);
      await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error(`[FirestoreDBService] Error upserting to ${collectionName}:`, err);
    }
  }

  static async delete(collectionName: keyof DatabaseSchema, id: string): Promise<void> {
    if (!db) return;
    try {
      const docRef = doc(db, collectionName as string, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(`[FirestoreDBService] Error deleting from ${collectionName}:`, err);
    }
  }
}
