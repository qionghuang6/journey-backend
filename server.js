import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Add Express
const express = require("express");
var cors = require("cors");

// Initialize Express
const app = express();
app.use(cors());

// Initialize firebase connection

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDhOXng3f5xxkKa8eVRvPMUw-Er5FS6nr0",
  authDomain: "sweaty-f47c6.firebaseapp.com",
  databaseURL: "https://sweaty-f47c6-default-rtdb.firebaseio.com",
  projectId: "sweaty-f47c6",
  storageBucket: "sweaty-f47c6.appspot.com",
  messagingSenderId: "65442840896",
  appId: "1:65442840896:web:1ec1f400f3f9659a47baa5",
  measurementId: "G-2J09KYV7D2",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Create GET request
app.get("/", (req, res) => {
  res.send("Express on Vercel");
});

app.get("/user", (req, res) => {
  res.json({ name: "philena" }).end();
});

// Initialize server
app.listen(3001, () => {
  console.log("Running on port 3001.");
});

// Export the Express API
module.exports = app;
