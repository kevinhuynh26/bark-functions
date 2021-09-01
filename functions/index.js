//Require all the modules
const { app, functions, db } = require("./util/admin");
const { getAllBarks } = require("./handlers/getBarks");
const { getOneBark, deleteOneBark } = require("./handlers/getBark");
const { postComment } = require("./handlers/postComment");
const { postOneBark } = require("./handlers/postBark");
const { signup, login } = require("./handlers/signup");
const { likeBark } = require("./handlers/barkLikes");
const {
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationRead,
} = require("./handlers/user");
const { FBAuth } = require("./util/fbAuth");


const cors = require('cors');
app.use(cors());


//////////////////////////////////////
//  ** NOTE **  //
//FBAuth helper function, Authentication

/*
GET route
./handlers/getBarks.js
*/
app.get("/getBarks", getAllBarks);
app.get("/getBark/:barkID", getOneBark);
app.delete("/getBark/:barkID", FBAuth, deleteOneBark); //

/*
./handlers/barkLikes.js
*/
app.get("/getBark/:barkID/like", FBAuth, likeBark);

/*
./handlers/postOneBark.js
*/
app.post("/postBark", FBAuth, postOneBark);
app.post("/getBark/:barkID/comment", FBAuth, postComment);

/*
./handlers/signup.js
*/
app.post("/signup", signup);
app.post("/login", login);

/*
./handler/user.js
*/
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.get("/user/:handle", getUserDetails);
app.post("/notifications", FBAuth, markNotificationRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions
  .region("us-central1")
  .firestore.document("likes/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/barks/${snapshot.data().barkID}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notification/${snapshot.id}`).set({
            barkID: doc.id,
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            read: false,
            createdAt: new Date().toISOString(),
            type: "like",
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });

exports.createNotificationOnUnlike = functions
  .region("us-central1")
  .firestore.document("likes/{id}")
  .onDelete((snapshot) => {
    return db
      .doc(`/notification/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("us-central1")
  .firestore.document("comments/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/barks/${snapshot.data().barkID}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notification/${snapshot.id}`).set({
            barkID: doc.id,
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            read: false,
            createdAt: new Date().toISOString(),
            type: "comment",
          });
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region("us-central1")
  .firestore.document("users/{userId}")
  .onUpdate((change) => {
    console.log("user image change");
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log("user image changed");
      const batch = db.batch();
      return db
        .collection("barks")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((element) => {
            const bark = db.doc(`/barks/${element.id}`);
            batch.update(bark, { userImage: change.after.data().imageUrl });
          });
          return db
            .collection("comments")
            .where("userHandle", "==", change.before.data().handle)
            .get();
        })
        .then((data) => {
          data.forEach((element) => {
            const comment = db.doc(`/comments/${element.id}`);
            batch.update(comment, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    }
  });

exports.onBarkDelete = functions
  .region("us-central1")
  .firestore.document("barks/{barkID}")
  .onDelete((snapshot, context) => {
    const barkID = context.params.barkID;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("barkID", "==", barkID)
      .get()
      .then((data) => {
        data.forEach((element) => {
          batch.delete(db.doc(`/comments/${element.id}`));
        });
        return db.collection("likes").where("barkID", "==", barkID).get();
      })
      .then((data) => {
        data.forEach((element) => {
          batch.delete(db.doc(`/likes/${element.id}`));
        });
        return db
          .collection("notification")
          .where("barkID", "==", barkID)
          .get();
      })
      .then((data) => {
        data.forEach((element) => {
          batch.delete(db.doc(`/notification/${element.id}`));
        });
        return batch.commit();
      });
  });
