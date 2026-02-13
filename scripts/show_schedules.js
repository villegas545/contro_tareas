const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();
db.collection('schedules').get().then(snapshot => {
    snapshot.docs.forEach(doc => {
        console.log('\n=== Schedule:', doc.id, '===');
        console.log(JSON.stringify(doc.data(), null, 2));
    });
    process.exit(0);
});
