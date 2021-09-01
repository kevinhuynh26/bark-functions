const { db, firebase } = require("../util/admin");
const { validateSignupData, validateLoginData } = require("../util/helpers");
const { firebaseConfig } = require("../util/config");
const noImage = "no-image.png";

exports.signup = (req, res) => {
  if (!req.body.hasOwnProperty("email"))
    return res.status(400).json({ email: "cannot be empty" });
  if (!req.body.hasOwnProperty("password"))
    return res.status(400).json({ password: "cannot be empty" });
  if (!req.body.hasOwnProperty("handle"))
    return res.status(400).json({ handle: "cannot be empty" });

  //Initialize newUser object
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return res.status(400).json(errors);

  let userToken, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(400).json({ handle: "handle is taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((doc) => {
      userId = doc.user.uid;
      return doc.user.getIdToken();
    })
    .then((token) => {
      userToken = token;
      const userCred = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${noImage}?alt=media`,
        userId,
      };
      return db.doc(`/users/${newUser.handle}`).set(userCred);
    })
    .then(() => {
      return res.status(201).json({ userToken });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res
          .status(400)
          .json({ error: `email already registered, /user/signup` });
      } else
        return res
          .status(500)
          .json({ error: "something went wrong, /user/signup" });
    });
};

exports.login = (req, res) => {
  //User information object
  const userLogin = {
    email: req.body.email,
    password: req.body.password,
  };

  const { valid, errors } = validateLoginData(userLogin);
  if (!valid) return res.status(400).json(errors);

  ///////////////////////////
  //Firebase provided Authorization Functions
  //signInWithEmailAndPassword(email, password) returns a promise
  firebase
    .auth()
    .signInWithEmailAndPassword(userLogin.email, userLogin.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      console.error(err);
      //auth/wrong-password
      //auth/user-not-found
      return res
        .status(403)
        .json({ general: "Wrong credentials, please try again, /user/login" });
    });
};
