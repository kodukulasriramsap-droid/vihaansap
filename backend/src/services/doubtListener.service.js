const { db } = require('../config/firebase');
const { sendNewDoubtAlert } = require('./whatsapp.service');

function initDoubtsListener() {
  if (!db) {
    console.warn('[DoubtListener] Firestore DB not initialized, skipping listener.');
    return;
  }

  console.log('[DoubtListener] Initializing Firestore onSnapshot listener for doubts...');

  // We query all doubts that haven't had a WhatsApp alert sent yet.
  // Using an open snapshot listener, we process 'added' events.
  db.collection('doubts')
    .where('whatsappAlertSent', '!=', true)
    .onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          // We only care about newly detected documents that match the query
          if (change.type === 'added') {
            const doubt = { id: change.doc.id, ...change.doc.data() };
            
            // Double-check idempotency locally just in case
            if (doubt.whatsappAlertSent) return;

            console.log(`[DoubtListener] Processing new doubt: ${doubt.id} from ${doubt.studentName}`);

            // Send the WhatsApp Alert
            const success = await sendNewDoubtAlert(doubt);

            // Regardless of success/failure, we mark it to prevent infinite retries
            // If it failed due to network, marking it prevents spam. 
            // If a robust retry is needed later, a different status enum could be used.
            try {
              await db.collection('doubts').doc(doubt.id).update({
                whatsappAlertSent: true,
                whatsappAlertSentAt: new Date().toISOString(),
                whatsappAlertSuccess: success
              });
              console.log(`[DoubtListener] Marked doubt ${doubt.id} as processed.`);
            } catch (err) {
              console.error(`[DoubtListener] Failed to update doubt ${doubt.id} status:`, err);
            }
          }
        });
      },
      (error) => {
        console.error('[DoubtListener] Error on doubts collection snapshot:', error);
      }
    );
}

module.exports = { initDoubtsListener };
