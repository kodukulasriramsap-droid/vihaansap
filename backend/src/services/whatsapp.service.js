const dotenv = require('dotenv');
dotenv.config();

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ADMIN_PHONE_NUMBER = process.env.WHATSAPP_ADMIN_PHONE_NUMBER;
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v20.0';

/**
 * Sends a WhatsApp alert for a newly submitted student doubt.
 * Uses the official Meta WhatsApp Cloud API.
 * 
 * @param {Object} doubt - The doubt document from Firestore.
 */
async function sendNewDoubtAlert(doubt) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ADMIN_PHONE_NUMBER) {
    console.warn('[WhatsApp] Missing WhatsApp configuration in .env. Skipping alert.');
    return false;
  }

  // Ensure we don't crash if optional fields are missing
  const studentName = doubt.studentName || 'Student';
  const batchName = doubt.batchName || 'Unknown Batch';
  const courseName = doubt.courseName || 'Unknown Course';
  const topic = doubt.topic || doubt.title || 'General Query';

  const payload = {
    messaging_product: 'whatsapp',
    to: WHATSAPP_ADMIN_PHONE_NUMBER,
    type: 'template',
    template: {
      name: 'new_student_doubt_alert',
      language: {
        code: 'en'
      },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: studentName },
            { type: 'text', text: batchName },
            { type: 'text', text: courseName },
            { type: 'text', text: topic }
          ]
        }
      ]
    }
  };

  try {
    console.log(`[WhatsApp] Sending new doubt alert for doubt ID: ${doubt.id}`);
    
    // Node.js 18+ includes native fetch
    const response = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp] Meta API Error:', JSON.stringify(data));
      return false;
    }

    console.log(`[WhatsApp] Alert sent successfully. Message ID: ${data.messages?.[0]?.id}`);
    return true;
  } catch (error) {
    console.error('[WhatsApp] Network/Execution Error:', error);
    // WhatsApp failure must NEVER cause the main flow to fail.
    return false;
  }
}

module.exports = {
  sendNewDoubtAlert
};
