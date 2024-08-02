const nodemailer=require('nodemailer')
const dotenv=require('dotenv');
dotenv.config();


const transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    },
    port:465,
    host:'smtp.gmail.com',
    secure:true
});

const sendEmail=(to,subject,text,attachment)=>{
    const mail={
        from:process.env.EMAIL_USER,
        to:to,
        subject:subject,
        text:text,
        attachments: [
            {
                filename: 'invoice.pdf',
                path: attachment,
            },
        ]
    }
    return transporter.sendMail(mail);
}

module.exports={sendEmail}
