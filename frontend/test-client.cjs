require('dotenv').config({ path: '../backend/.env' });
const { admin, db: adminDb } = require('../backend/src/config/firebase');

// The client SDKs we need
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken } = require('firebase/auth');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  // Try to use the web config. Since this is testing against the actual db, we just need the projectId.
  projectId: process.env.FIREBASE_PROJECT_ID,
  apiKey: "dummy-api-key", // Not strictly needed for custom token login in some older SDKs or we can use a REST call, wait.
  // Actually, client SDK needs a valid API key. We can read it from frontend/.env or we can just use the Admin SDK to verify rules.
};

async function testClient() {
  const uid = "weHRVuti5HbvmHTDwi3phEdIkfw1"; // Sri Ram
  const batchId = "ahl811ymx"; // From previous test
  console.log(`Testing as student UID: ${uid} for batch: ${batchId}`);

  // Fetch from frontend config to get API key if possible
  const fs = require('fs');
  let apiKey = '';
  try {
    const env = fs.readFileSync('../frontend/.env', 'utf-8');
    const match = env.match(/VITE_FIREBASE_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim();
  } catch(e) {}

  if (!apiKey) {
    console.log("Could not find frontend API key. Cannot use client SDK directly. Exiting.");
    process.exit(1);
  }

  firebaseConfig.apiKey = apiKey;
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const clientDb = getFirestore(app);

  try {
    const customToken = await admin.auth().createCustomToken(uid);
    await signInWithCustomToken(auth, customToken);
    console.log("Signed in successfully as student.");
    
    console.log("\n--- TESTING RECORDINGS Q4 (visibility == 'Students') ---");
    const q4 = query(collection(clientDb, 'recordings'), where('batchId', 'in', [batchId]), where('visibility', '==', 'Students'));
    try {
      const snap = await getDocs(q4);
      console.log(`Q4 Success. Returned ${snap.size} documents.`);
      snap.forEach(d => console.log(d.id, d.data().title));
    } catch (e) {
      console.error("Q4 Failed:", e.message);
    }

    console.log("\n--- TESTING RECORDINGS Q1 (recipientMode == 'all') ---");
    const q1 = query(collection(clientDb, 'recordings'), where('batchId', 'in', [batchId]), where('recipientMode', '==', 'all'));
    try {
      const snap = await getDocs(q1);
      console.log(`Q1 Success. Returned ${snap.size} documents.`);
      snap.forEach(d => console.log(d.id, d.data().title));
    } catch (e) {
      console.error("Q1 Failed:", e.message);
    }

    console.log("\n--- TESTING STUDY MATERIALS Q4 ---");
    const q4m = query(collection(clientDb, 'studyMaterials'), where('batchId', 'in', [batchId]), where('visibility', '==', 'Students'));
    try {
      const snap = await getDocs(q4m);
      console.log(`Q4 Materials Success. Returned ${snap.size} documents.`);
      snap.forEach(d => console.log(d.id, d.data().title));
    } catch (e) {
      console.error("Q4 Materials Failed:", e.message);
    }

  } catch (e) {
    console.error("Test failed:", e);
  }
}

testClient().catch(console.error).finally(() => process.exit(0));
