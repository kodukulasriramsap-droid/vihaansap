require('dotenv').config();
const { db } = require('./src/config/firebase');

async function test() {
  console.log('--- FETCHING 1 RECORDING ---');
  const recordingsSnap = await db.collection('recordings').limit(1).get();
  let recording = null;
  if (!recordingsSnap.empty) {
    recording = { id: recordingsSnap.docs[0].id, ...recordingsSnap.docs[0].data() };
    console.log(JSON.stringify(recording, null, 2));
  } else {
    console.log('No recordings found.');
  }

  console.log('\n--- FETCHING 1 STUDY MATERIAL ---');
  const materialsSnap = await db.collection('studyMaterials').limit(1).get();
  let material = null;
  if (!materialsSnap.empty) {
    material = { id: materialsSnap.docs[0].id, ...materialsSnap.docs[0].data() };
    console.log(JSON.stringify(material, null, 2));
  } else {
    console.log('No study materials found.');
  }

  console.log('\n--- FETCHING RELATED BATCH AND STUDENT ---');
  const batchId = recording?.batchId || material?.batchId;
  if (batchId) {
    console.log(`Fetching batch: ${batchId}`);
    const batchSnap = await db.collection('batches').doc(batchId).get();
    if (batchSnap.exists) {
      const batch = { id: batchSnap.id, ...batchSnap.data() };
      console.log('Batch:', JSON.stringify({ id: batch.id, course: batch.course, studentIds: batch.studentIds?.slice(0, 3) }, null, 2));

      if (batch.studentIds && batch.studentIds.length > 0) {
        const studentId = batch.studentIds[0];
        console.log(`\nFetching student: ${studentId}`);
        const studentSnap = await db.collection('students').doc(studentId).get();
        if (studentSnap.exists) {
          const student = { id: studentSnap.id, ...studentSnap.data() };
          console.log('Student:', JSON.stringify({ id: student.id, uid: student.uid, email: student.email, name: student.name }, null, 2));
        } else {
          console.log('Student not found in students collection by ID. Trying by uid...');
          const studentQuery = await db.collection('students').where('uid', '==', studentId).limit(1).get();
          if (!studentQuery.empty) {
            const student = { id: studentQuery.docs[0].id, ...studentQuery.docs[0].data() };
            console.log('Student found by uid:', JSON.stringify({ id: student.id, uid: student.uid, email: student.email, name: student.name }, null, 2));
          } else {
            console.log('Student not found by uid either.');
          }
        }
      }
    } else {
      console.log('Batch not found.');
    }
  }
}

test().catch(console.error).finally(() => process.exit(0));
