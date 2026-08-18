const { db } = require('../config/firebase');
const { sendNewDoubtAlert } = require('./whatsapp.service');

// Guard to prevent multiple listeners from being registered
let listenerInitialized = false;

function initDoubtsListener() {
  if (!db) {
    console.warn('[DoubtListener] Firestore DB not initialized, skipping listener.');
    return;
  }

  if (listenerInitialized) {
    console.warn('[DoubtListener] Listener already initialized. Skipping duplicate registration.');
    return;
  }

  listenerInitialized = true;
  console.log('[DoubtListener] Initializing Firestore onSnapshot listener for doubts...');

  // Listen for doubts that have not been successfully processed yet.
  // whatsappAlertSent is only set to true after a CONFIRMED successful API call.
  // whatsappAlertFailed is set to true if the API call fails (prevents infinite retry spam).
  db.collection('doubts')
    .where('whatsappAlertSent', '!=', true)
    .onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          // Only process newly added (or newly matching) documents
          if (change.type !== 'added') return;

          const doubt = { id: change.doc.id, ...change.doc.data() };

          // Hard idempotency guard: skip if already successfully sent
          if (doubt.whatsappAlertSent === true) return;

          // Skip if previously failed — prevents infinite retry on permanent failures.
          // A manual reset (deleting whatsappAlertFailed) can trigger a retry if needed.
          if (doubt.whatsappAlertFailed === true) return;

          console.log(`[DoubtListener] Processing new doubt: ${doubt.id} from ${doubt.studentName}`);

          // Send the WhatsApp Alert
          const success = await sendNewDoubtAlert(doubt);

          if (success) {
            // Only mark as sent on CONFIRMED API success
            try {
              await db.collection('doubts').doc(doubt.id).update({
                whatsappAlertSent: true,
                whatsappAlertSentAt: new Date().toISOString(),
                whatsappAlertSuccess: true,
              });
              console.log(`[DoubtListener] Marked doubt ${doubt.id} as successfully alerted.`);
            } catch (err) {
              console.error(`[DoubtListener] Failed to update doubt ${doubt.id} success status:`, err.message);
            }
          } else {
            // Mark as failed so we don't retry indefinitely on permanent failures
            // (e.g. invalid template, revoked token). A transient network failure
            // will be retried on the next snapshot event only if whatsappAlertFailed is not set.
            try {
              await db.collection('doubts').doc(doubt.id).update({
                whatsappAlertFailed: true,
                whatsappAlertFailedAt: new Date().toISOString(),
                whatsappAlertSuccess: false,
              });
              console.warn(`[DoubtListener] Marked doubt ${doubt.id} as failed. Check WhatsApp config.`);
            } catch (err) {
              console.error(`[DoubtListener] Failed to update doubt ${doubt.id} failure status:`, err.message);
            }
          }
        });
      },
      (error) => {
        console.error('[DoubtListener] Error on doubts collection snapshot:', error.message);
      }
    );
}

module.exports = { initDoubtsListener };
