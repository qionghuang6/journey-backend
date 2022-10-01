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
app.get("/", async (req, res) => {
  const userId = "test";
  const query = firestore.query(userRef, firestore.where("id", "==", userId));
  const resultDocs = await firestore.getDocs(query);
  //utils.assert(
  //  resultDocs.length === 1,
  //  "Too many users returned for a given userId"
  //);
  resultDocs.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    console.log(doc.id, " => ", doc.data());
    res.status(200);
    res.json(doc.data()).end();
  });
});

// User

// Body expected to have a user field with the user's ID.
// Returns the json object of the user
app.get("/user/lookup", async (req, res) => {
  const userId = req.body.user ? req.body.user : null;
  if (userId === null) {
    res.status(404);
    res.send("userId not specified").end();
  }
  const query = firestore.query(userRef, firestore.where("id", "==", userId));
  const resultDocs = await firestore.getDocs(query);
  //utils.assert(
  //  resultDocs.length === 1,
  //  "Too many users returned for a given userId"
  //);
  if (resultDocs.length != 1) {
    res.status(500);
    res.send("Too many users returned for a given userId").end();
  } else {
    resultDocs.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      res.status(200);
      res.json(doc.data()).end();
    });
  }
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
  if (location) {
    for (const queryResult of resultDocs) {
      if (
        queryResult.location &&
        utils.distance(Array(queryResult.location), location) <= radius
      ) {
        result.push(queryResult);
      }
    }
  }
  res.status(200);
  res.json({ experiences: result }).end();
});

// Journeys

// Initialize server
app.listen(3001, () => {
  console.log("Running on port 3001.");
});

// Export the Express API
module.exports = app;
