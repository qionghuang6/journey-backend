import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { distance, assert } from "./utils.js";
import express from "express";
import cors from "cors";

// Add Express
//const express = require("express");
//var cors = require("cors");

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
const firebaseApp = await initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = await getFirestore(firebaseApp);

// Different tables
const userRef = await collection(db, "user");
const journeyRef = await collection(db, "journey");
const experienceRef = await collection(db, "experience");
const commentRef = await collection(db, "comment");
const adventureRef = await collection(db, "adventure");

// Create GET request
app.get("/", async (req, res) => {
  const userId = "test";
  const userQuery = await query(userRef, where("id", "==", userId));
  const resultDocs = await getDocs(userQuery);
  assert(
    Array(resultDocs).length === 1,
    "Too many users returned for a given userId"
  );
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
  const userQuery = query(userRef, where("id", "==", userId));
  const resultDocs = await getDocs(userQuery);
  assert(
    Array(resultDocs).length === 1,
    "Too many users returned for a given userId"
  );
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

// Looks up and returns all of the experiences belonging to the specified users in a given distance from the given location
// Precondition: req.body.users must be an array of user IDs length > 0
// req.body.radius must be > 0 and req.body.location must be a valid location
// where req.body.tag == the tag requested from the experience
// Returns: A list of experiences satisfying the conditions
app.get("experiences/radar", async (req, res) => {
  const users = req.body.users ? req.body.users : null;
  const radius = req.body.radius ? req.body.radius : null;
  const location = req.body.location ? req.body.location : null;
  const target_tag = req.body.tag ? req.body.tag : null;
  // Get all results for the given users
  const query = query(
    experienceRef,
    where("tag", "==", target_tag),
    where("user", "in", users)
  );
  const resultDocs = await getDocs(query);
  result = [];
  // Filter query results by distance
  if (location) {
    resultDocs.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      const data = doc.data();
      if (data.location && distance(Array(data.location), location) <= radius) {
        result.push(data);
      }
    });
    res.status(200);
    res.json({ experiences: result }).end();
  } else {
    res.status(404);
    res.send("Location not specified, please enable GPS access").end();
  }
});

// Looks up and returns ALL experiences with the parent id matching the given adventure id
// Requires a id specifying the adventure id
app.get("experiences/lookup", async (req, res) => {
  const parentId = req.body.id;
  try {
    const query = query(experienceRef, where("parent", "==", parentId));
    const resultDocs = await getDocs(query);
    result = [];
    resultDocs.forEach((doc) => {
      result.push(doc.data);
    });
    res.status(200);
    res.json({ experiences: result }).end();
    console.log(
      "Experiences successfully looked up with parent id: ",
      parentId
    );
  } catch (e) {
    res.status(404);
    res.send("Error looking up experiences: ", e).end();
    console.log("Error looking up experiences: ", e);
  }
});

// Adds a new experience to the db
// Requires a location name (for looking up in Google places API later), post id, picture urls, rating, and a tag
app.post("experiences/add", async (req, res) => {
  const name = req.body.name;
  const parentId = req.body.parent;
  const pictures = req.body.pictures;
  const rating = req.body.rating;
  const tag = req.body.tag;
  const timestamp = Timestamp.now();
  try {
    const docRef = await addDoc(collection(db, "experience"), {
      name: name,
      parent: parentId,
      pictures: pictures,
      rating: rating,
      tag: tag,
      timestamp: timestamp,
    });
    console.log("New experience written with ID: ", docRef.id);
    res.status(200);
    res.send("Experience successfully added with ID: ", docRef.id).end();
  } catch (e) {
    res.status(500);
    res.send("Error adding experience: ", e).end();
    console.error("Error adding experience: ", e);
  }
});

// Journeys

// Initialize server
app.listen(3001, () => {
  console.log("Running on port 3001.");
});
