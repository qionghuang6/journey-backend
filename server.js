const firebase = require("firebase/app");
const firestore = require("firebase/firestore");
const utils = require("./utils");

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
const firebaseApp = firebase.initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = firestore.getFirestore(firebaseApp);

// Different tables
const userRef = firestore.collection(db, "user");
const journeyRef = firestore.collection(db, "journey");
const experienceRef = firestore.collection(db, "experience");
const commentRef = firestore.collection(db, "comment");
const adventureRef = firestore.collection(db, "adventure");

// Create GET request
app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// User

app.get("/user/lookup", (req, res) => {
  const userId = req.body.user;

  res.json({ name: "philena" }).end();
});

// Experiences

// Precondition: req.body.users must be an array of user IDs length > 0
// req.body.radius must be > 0 and req.body.location must be a valid location
// where req.body.tag == the tag requested from the experience
// Returns: A list of experiences satisfying the conditions
app.get("experiences/lookup", async (req, res) => {
  const users = req.body.users ? req.body.users : null;
  const radius = req.body.radius ? req.body.radius : null;
  const location = req.body.location ? req.body.location : null;
  const target_tag = req.body.tag ? req.body.tag : null;
  // Get all results for the given users
  const query = firestore.query(
    experienceRef,
    where("tag", "==", target_tag),
    where("user", "in", users)
  );
  const resultDocs = await firestore.getDocs(query);
  result = [];
  // Filter query results by distance
  for (const queryResult of resultDocs) {
    //if (doc.location && Array(doc.location))
  }
});

// Journeys

// Initialize server
app.listen(3001, () => {
  console.log("Running on port 3001.");
});

// Export the Express API
module.exports = app;
