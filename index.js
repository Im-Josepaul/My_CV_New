const express = require('express');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const TO_EMAIL = process.env.DEFAULT_EMAIL;
const PASS = process.env.PASSKEY;
const URL = process.env.MONGODB_URL;
const PORT = process.env.PORT;

const client = new MongoClient(URL);

async function getCollection() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to Database");

    return client.db("MyCV").collection("CVData");
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
}

app.get("/",async (req,res)=> {
  var data = await getCollection();
  if(data){
    console.log("Collection recieved from database.");
  }
  const aboutData = await data.findOne({}, { projection: { about: 1, resume: 1, projects: 1 } });
  if (!aboutData) {
    return res.status(404).send('Data not found');
  }

  // Pass data to EJS template
  res.render("index.ejs", {
    about: aboutData.about.about_me,
    resume: aboutData.resume,
    projects: aboutData.projects,
  });
});

app.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail', // or smtp config
    auth: {
      user: TO_EMAIL,
      pass: PASS // App password, NOT your Gmail login
    }
  });

  const mailOptions = {
    from: email,
    to: TO_EMAIL,
    subject: subject,
    text: `Message from ${name} \n\n${message}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Email send failed:', err);
      return res.status(500).json({ error: 'Failed to send email' });
    }
    res.status(200).json({ message: 'Email sent successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port:${PORT}`);
  console.log("Visit: http://localhost:3000");
});
