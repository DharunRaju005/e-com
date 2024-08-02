const serviceAccount = require('../serviceAccountKey.json'); // Path to your downloaded service account key
const admin = require("firebase-admin");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'gs://e-com-8cc81.appspot.com'
});

const bucket = admin.storage().bucket();

const uploadImgToFirebase=async(file,filename)=>{
    const upload=bucket.file(filename);
    const stream=upload.createWriteStream({
        metadata:{
            contentType:file.mimetype
        },
        resumable:false
    });
    return new Promise((resolve,reject)=>{
        stream.on('finish',async()=>{
            try{
                await upload.makePublic();
                const URL=`https://storage.googleapis.com/${bucket.name}/${upload.name}`;
                resolve(URL);
            }
            catch(err){
                reject(err);
            }
        })
        stream.end(file.buffer)
    })
}
module.exports={admin,bucket,uploadImgToFirebase}
