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
  doc,
  setDoc,
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
app.use(express.json());

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

// Default page
app.get("/", async (req, res, next) => {
  try {
    const userId = "test_user";
    //const userQuery = await query(userRef, where("id", "==", userId));
    const docRef = doc(db, "user", userId);
    const resultDoc = await getDoc(docRef);
    assert(resultDoc.exists(), "DOESNT EXIST");
    console.log(resultDoc.id, " => ", resultDoc.data());
    res.status(200);
    res.json(resultDoc.data()).end();
    //const userId = "test2";
    //const userName = "Jod";
  } catch (e) {
    next(e);
    console.log("Error: ", e);
  }
});

// Users

// Query expected to have a user field with the user's ID.
// Returns the json object of the user
app.get("/api/user/lookup", async (req, res, next) => {
  try {
    const userId = req.query.user;
    assert(userId, "UserId does not exist");
    const userQuery = query(userRef, where("id", "==", userId));
    const resultDoc = await getDocs(userQuery);
    resultDoc.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      res.status(200);
      res.json(doc.data()).end();
    });
  } catch (e) {
    next(e);
    console.error("Error finding user ", req.query.user, ": ", e);
  }
});

// NOT WORKING
app.post("/api/user/addFriend", async (req, res, next) => {
  try {
    const userId = req.body.user;
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
  } catch (e) {
    next(e);
    console.error("Error finding user: ", e);
  }
});

// Adds a user with the given name, id (Google OAUTH ID). Optionally takes a list of friends and a profile picture url
app.post("/api/user/add", async (req, res, next) => {
  try {
    const name = req.body.name;
    const id = req.body.id;
    const picture = req.body.picture ? req.body.picture : null;
    const friends = req.body.friends ? req.body.friends : null;
    const doc = doc(db, "user");
    const docRef = await addDoc(
      userRef,
      {
        name: name,
        id: id,
        picture: picture,
        friends: friends,
      },
      { merge: true }
    );
    console.log("New user added with ID: ", docRef.id);
    res.status(200).end();
  } catch (e) {
    next(e);
    console.error("Error adding user: ", e);
  }
});

// Experiences

// Looks up and returns all of the experiences belonging to the specified users in a given distance from the given location
// Precondition: req.query.users must be an array of user IDs length > 0
// req.query.radius must be > 0 and req.query.location must be a valid location
// where req.query.tag == the tag requested from the experience
// Returns: A list of experiences satisfying the conditions
app.get("/api/experiences/radar", async (req, res, next) => {
  try {
    const users = req.query.users ? Array(req.query.users) : null;
    assert(
      Array.isArray(users) && users.length > 0,
      "Must specify users to query"
    );
    const latitude = req.query.latitude ? Number(req.query.latitude) : null;
    const longitude = req.query.longitude ? Number(req.query.longitude) : null;
    const radius = req.query.radius ? Number(req.query.radius) : 0;
    const target_tag = req.query.tag ? req.query.tag : null;
    // Get all results for the given users
    const radarQuery = query(
      experienceRef,
      where("tag", "==", target_tag),
      where("user", "in", users)
    );
    const resultDocs = await getDocs(radarQuery);
    const result = [];
    // Filter query results by distance
    if (latitude && longitude) {
      resultDocs.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        const data = doc.data();
        if (
          radius === 0 ||
          (data.location &&
            distance(
              [data.location._lat, data.location._long],
              [latitude, longitude]
            ) <= radius)
        ) {
          result.push(data);
        }
      });
      res.status(200);
      res.json({ experiences: result }).end();
      console.log("Successfully returned radar query");
    } else {
      throw new Error("Location not specified, please enable GPS access");
    }
  } catch (e) {
    next(e);
    console.error("Error finding experiences using radar: ", e);
  }
});

// Looks up and returns ALL experiences with the parent id matching the given adventure id
// Requires a id specifying the adventure id
app.get("/api/experiences/lookup", async (req, res, next) => {
  const parentId = req.query.id;
  try {
    const query = query(experienceRef, where("parent", "==", parentId));
    const resultDocs = await getDocs(query);
    const result = [];
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
    next(e);
    console.error("Error looking up experiences: ", e);
  }
});

// Adds a new experience to the db
// Requires a location name (for looking up in Google places API later), post id, picture urls, rating, and a tag
app.post("/api/experiences/add", async (req, res, next) => {
  try {
    const name = req.body.name;
    const parentId = req.body.parent;
    const pictures = req.body.pictures;
    const rating = req.body.rating;
    const tag = req.body.tag;
    const timestamp = Timestamp.now();
    const docRef = await addDoc(collection(db, "experience"), {
      name: name,
      parent: parentId,
      pictures: pictures,
      rating: rating,
      tag: tag,
      timestamp: timestamp,
    });
    console.log("New experience added with ID: ", docRef.id);
    res.status(200).end();
  } catch (e) {
    next(e);
    console.error("Error adding experience: ", e);
  }
});

// Journeys

// Adventures

// Initialize server
app.listen(3001, () => {
  console.log("Running on port 3001.");
});
