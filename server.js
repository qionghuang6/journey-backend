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
  updateDoc,
  arrayUnion,
  increment,
  limit,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { distance, assert } from "./utils.js";
import express from "express";
import cors from "cors";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

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
const auth = await getAuth();

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

// Query expected to have a user field with the user's ID or email.
// Returns the json object of the user
app.get("/api/user/lookup", async (req, res, next) => {
  try {
    const userId = req.query.user ? req.query.user : null;
    const email = req.query.email ? req.query.email : null;
    assert(userId != null || email != null, "UserID and email aren't defined");
    let userQuery;
    if (userId === null) {
      userQuery = query(userRef, where("email", "==", email));
    } else {
      userQuery = query(userRef, where("id", "==", userId));
    }
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

app.post("/api/user/login", (req, res) => {
  signInWithEmailAndPassword(auth, req.body.email, req.body.password)
    .then((userCredential) => {
      // Signed in
      res.status(201).end();
    })
    .catch((error) => {
      const errorMessage = error.message;
      console.error(errorMessage);
    });
});

app.post("/api/user/logout", (req, res) => {
  signOut(auth)
    .then(() => {
      // Sign-out successful.
      res.status(201).end();
    })
    .catch((error) => {
      // An error happened.
      console.error(error);
    });
});

// Adds a user with the given name, email, and password. Optionally takes a list of friends and a profile picture url
app.post("/api/user/add", async (req, res, next) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const picture = req.body.picture ? req.body.picture : null;
    const friends = req.body.friends ? req.body.friends : null;
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        const docRef = addDoc(
          userRef,
          {
            name: name,
            email: user.email,
            picture: picture,
            friends: friends,
          },
          { merge: true }
        );
        console.log("New user added with ID: ", docRef.id);
        res.status(201);
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify({ id: docRef.id })).end();
      })
      .catch((error) => {
        throw new Error(error);
      });
  } catch (e) {
    next(e);
    console.error("Error adding user: ", e);
  }
});

// Requires a user ID making the request to become friends (requesterID) and a user ID getting requested to become friends (requestedID)
app.post("/api/user/friend/add", async (req, res, next) => {
  try {
    const requesterID = req.body.requesterID;
    const requestedID = req.body.requestedID;
    const friendQuery = query(
      userRef,
      where("id", "in", [requestedID, requesterID])
    );
    const resultDocs = await getDocs(friendQuery);
    assert(
      Array(resultDocs).length === 2,
      "Too many users returned for a given userId"
    );
    if (resultDocs.length != 1) {
      throw new Error("Too many users returned for a given userId friends");
    } else {
      resultDocs.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        updateDoc(doc, {
          friends: arrayUnion(requesterID, requestedID),
        });
        res.status(201).end();
      });
    }
  } catch (e) {
    next(e);
    console.error("Error finding user: ", e);
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
    const latitude = req.query.latitude ? Number(req.query.latitude) : null;
    const longitude = req.query.longitude ? Number(req.query.longitude) : null;
    const radius = req.query.radius ? Number(req.query.radius) : 0;
    const target_tag = req.query.tag ? req.query.tag : null;
    // Get all results for the given users
    const radarQuery = query(
      experienceRef,
      where("tag", "==", target_tag),
      limit(25)
    );
    const resultDocs = await getDocs(radarQuery);
    const result = [];
    // Filter query results by distance
    if (latitude && longitude) {
      resultDocs.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        const data = doc.data();
        console.log("DATAAA", data);
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
      console.log("RESULT", result);
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
    const latitude = req.body.latitude;
    const longitude = req.body.longitude;
    const rating = req.body.rating;
    const tag = req.body.tag;
    const timestamp = Timestamp.now();
    const docRef = await addDoc(
      experienceRef,
      {
        name: name,
        parent: parentId,
        pictures: pictures,
        latitude: latitude,
        longitude: longitude,
        rating: rating,
        tag: tag,
        timestamp: timestamp,
      },
      { merge: true }
    );
    console.log("New experience added with ID: ", docRef.id);
    res.status(201);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify({ id: docRef.id })).end();
  } catch (e) {
    next(e);
    console.error("Error adding experience: ", e);
  }
});

// Journeys

// Requires a parent adventure ID (returned as the id from the /api/adventures/add endpoint), the distance traveled, the time taken (in seconds as a JS Date object), and an array of picture dataURLs as a json array
app.post("/api/journeys/add", async (req, res, next) => {
  try {
    const parent = req.body.parent;
    const pictures = req.body.pictures;
    // Distance and time are fluff features, so if we have the time to implement them we can later.
    const distance = req.body.distance;
    const time = req.body.time;
    const timestamp = Timestamp.now();
    const docRef = await addDoc(
      journeyRef,
      {
        parent: parent,
        pictures: pictures,
        distance: distance,
        time: time,
        timestamp: timestamp,
      },
      { merge: true }
    );
    console.log("New journey added with ID: ", docRef.id);
    res.status(201).end();
  } catch (e) {
    next(e);
    console.error("Error adding adventure: ", e);
  }
});

// Requires a parent adventure ID
app.get("/api/journeys/lookup", async (req, res, next) => {
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
    console.log("Journeys successfully looked up with parent id: ", parentId);
  } catch (e) {
    next(e);
    console.error("Error looking up journeys: ", e);
  }
});

// Adventures

// Requires an author id, a given id (title for now), a firebase adventure ID, and an array of [lng, lat] coordinates for routing
app.post("/api/adventures/add", async (req, res, next) => {
  try {
    const adventureRef = doc(adventureRef, req.body.adventureId);
    const author = req.body.author;
    const title = req.body.title;
    const likes = 0;
    const route = req.body.route;
    const timestamp = Timestamp.now();
    const docRef = await setDoc(
      adventureRef,
      {
        author: author,
        title: title,
        likes: likes,
        route: route,
        timestamp: timestamp,
      },
      { merge: true }
    );
    console.log("New adventure added with ID: ", docRef.id);
    res.status(201);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify({ id: docRef.id })).end();
  } catch (e) {
    next(e);
    console.error("Error adding adventure: ", e);
  }
});

// Need the firebase adventure ID
app.post("/api/adventures/like", async (req, res, next) => {
  try {
    const adventureId = req.body.id;
    const adventureDoc = doc(adventureRef, adventureId);
    updateDoc(adventureDoc, {
      likes: increment(1),
    });
    res.status(201).end();
  } catch (e) {
    next(e);
    console.error("Error liking an adventure: ", e);
  }
});

// Need the firebase adventure ID
app.post("/api/adventures/unlike", async (req, res, next) => {
  try {
    const adventureId = req.body.id;
    const adventureDoc = doc(adventureRef, adventureId);
    updateDoc(adventureDoc, {
      likes: increment(-1),
    });
    res.status(201).end();
  } catch (e) {
    next(e);
    console.error("Error unliking an adventure: ", e);
  }
});

// Requires the adventure author id and the adventure title
// Returns a json with the data and the firebase adventure ID
app.get("/api/adventures/lookup", async (req, res, next) => {
  try {
    const author = req.query.author;
    const title = req.query.title;
    const resultDoc = await getDocs(
      adventureRef,
      where("author", "==", author),
      where("title", "==", title)
    );
    resultDoc.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      console.log("Adventure retrieved with id", doc.id);
      res.status(200);
      res.json({ data: doc.data(), id: doc.id }).end();
    });
  } catch (e) {
    next(e);
    console.error("Error getting adventure: ", e);
  }
});

app.get("/api/adventures/getall", async (req, res, next) => {
  try {
    const resultDoc = await getDocs(adventureRef);
    const results = [];
    resultDoc.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      console.log("Adventure retrieved with id", doc.id);
      results.push({ data: doc.data(), id: doc.id });
    });
    res.status(200);
    console.log("Retrieved all adventures!");
    res.json({ experiences: results }).end();
  } catch (e) {
    next(e);
    console.error("Error getting all adventures: ", e);
  }
});

// Generates a new firebase adventure doc id for later use
app.get("/api/adventures/generate", async (req, res, next) => {
  try {
    const docRef = doc(adventureRef);
    res.status(200);
    res.json({ id: docRef.id }).end();
  } catch (e) {
    next(e);
    console.error("Error generating adventure: ", e);
  }
});

// Initialize server
app.listen(process.env.PORT || 3001, () => {
  console.log("Running on port 3001.");
});
