//Firebase Configuration Key for our database connectivity
const firebaseConfig = {
  apiKey: "AIzaSyADDZqUJyeSPnDlP-SBSYwDcGFgPmJxxO8",
  authDomain: "barker-pc100.firebaseapp.com",
  databaseURL: "https://barker-pc100.firebaseio.com",
  projectId: "barker-pc100",
  storageBucket: "barker-pc100.appspot.com",
  messagingSenderId: "850072662058",
  appId: "1:850072662058:web:7412b847ae5e1ebe6f9353",
  measurementId: "G-MF0GR5148W",
};

///////////////////////////
//Regular Expression for Email Validation
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

module.exports = { firebaseConfig, emailRegex };
