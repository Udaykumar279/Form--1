require('dotenv').config();

const nodemailer = require('nodemailer');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns =  require('dns');

dns.setServers([
     '1.1.1.1',
      '8.8.8.8' 
])


const app = express();
const PORT = process.env.PORT || 3000;
console.log("MONGO_URI:" , process.env.MONGO_URI);


//middleware

app.use(cors())
app.use(express.json())


//Nodemailer

console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS =", process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  service: "gmail",
   auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
   }

})


//  Database
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB cloud database is connected"))
.catch(err => console.log(err));


//  Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  message: String,
  phone: String
});

const User = mongoose.model("User", userSchema);



//  API
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // validation
    if (!name || !email || !phone || !message) {
      return res.json({ message: "Fill all the fields" });
    }

    // check existing
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists" });
    }

    // create user
    const newUser = new User({             
      name,
      email,
      phone,
      message
    });

    await newUser.save();

        
       // Send Email  -  (Nodemailer)

          await transporter.verify();
          console.log("SMTP connection successfull");

          await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER, // Your email
          
          subject: "New Contact Form Submission",
          html: `
          
           <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Message:</strong> ${message}</p>
           `
          });




    res.json({ message: "User registered successfully  and email sent " });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});


//  Start server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

