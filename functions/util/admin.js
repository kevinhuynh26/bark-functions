//Require Firebase and Firebase Admin
//Firebase Function here by default
//Firebase Admin for Cloud Functionality and DB Access
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const config = require("./config");

admin.initializeApp();

//Require Express and Initialize to use expres routing
const express = require("express");
const app = express();

const firebase = require("firebase");
firebase.initializeApp(config.firebaseConfig);

//Quality of Life so we don't have to write admin.firestore()... everywhere
const db = admin.firestore();

///////////////////////////
//Local Development Emulator Address
if (process.env.NODE_ENV === "development") {
  firebase.functions().useFunctionsEmulator("http://localhost:5001");
}

module.exports = { functions, admin, app, firebase, db, config };
