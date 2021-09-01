const { admin, db } = require("../util/admin");
const { firebaseConfig } = require("../util/config");
const { reduceUserDetails } = require("../util/helpers");
const { get } = require("http");

///////////////////////////
//Get authenticated user details
exports.getAuthenticatedUser = (req, res) => {
  //user data object that we will populate
  let userData = {};
  db.doc(`/users/${req.user.handle}`)
    .get()
    .then((doc) => {
      //check if document exists or it will crash our program
      if (doc.exists) {
        //set our user data object's credentials to the current logged in user's data
        userData.credentials = doc.data();
        //return "likes" collection from the user's profile
        return db
          .collection("likes")
          .where("userHandle", "==", req.user.handle)
          .get();
      }
    })
    .then((data) => {
      userData.likes = [];
      data.forEach((doc) => {
        userData.likes.push(doc.data());
      });
      return db
        .collection("notification")
        .where("recipient", "==", req.user.handle)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();
    })
    .then((data) => {
      userData.notifications = [];
      data.forEach((notif) => {
        userData.notifications.push({
          barkID: notif.data().barkID,
          recipient: notif.data().recipient,
          sender: notif.data().sender,
          read: notif.data().read,
          createdAt: notif.data().createdAt,
          type: notif.data().type,
          notificationId: notif.id,
        });
      });
      return res.json(userData);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.code });
    });
};

///////////////////////////
//Firebase Image Upload
//BusBoy file uploader and html form data parser
exports.uploadImage = (req, res) => {
  console.log("./handlers/signup.js/uploadImage function");
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageFileName;
  let imageToBeUploaded = {};

  //Busboy "file" event trigger
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log("busboy file");
    //handle mismatching file type
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res
        .status(400)
        .json({ error: "Please select a JPEG/JPG/PNG file" });
    }
    console.log(fieldname);
    console.log(filename);
    console.log(mimetype);
    //find the file extention type by parsing the file name string
    const imageExtention = filename.split(".")[filename.split(".").length - 1];
    //generate random file name
    imageFileName = `${Math.round(
      Math.random() * 100000000000
    )}.${imageExtention}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = {
      filepath,
      mimetype,
    };
    file.pipe(fs.createWriteStream(filepath));
  });

  //Busboy "finish" event trigger
  busboy.on("finish", () => {
    //upload the image to firestore bucket, returning a promise
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resusmable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        //update the image url for the user here if promise resolves
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
        return db
          .doc(`/users/${req.user.handle}`)
          .update({ imageUrl: imageUrl });
      })
      .then(() => {
        return res.json({ message: "image uploaded success" });
      })
      .catch((err) => {
        //error message on rejected image upload
        console.error(err);
        return res.status(400).json({ err });
      });
  });
  busboy.end(req.rawBody);
};

///////////////////////////
//Update user details
exports.addUserDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.handle}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: "details successfully updated/added" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

///////////////////////////
//Get user profile
exports.getUserDetails = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.params.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userData.user = doc.data();
        return db
          .collection("barks")
          .where("userHandle", "==", req.params.handle)
          .orderBy("createdAt", "desc")
          .get();
      } else {
        return res.status(404).json({ error: "404, doggo not found" });
      }
    })
    .then((data) => {
      userData.barks = [];
      data.forEach((element) => {
        userData.barks.push({
          body: element.data().body,
          createdAt: element.data().createdAt,
          userHandle: element.data().userHandle,
          userImage: element.data().userImage,
          likeCount: element.data().likeCount,
          commentCount: element.data().commentCount,
          barkID: element.id,
        });
      });
      return res.json(userData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

///////////////////////////
//User viewed notifications
exports.markNotificationRead = (req, res) => {
  let batch = db.batch();
  req.body.forEach((notificationId) => {
    const notification = db.doc(`/notification/${notificationId}`);
    batch.update(notification, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return res.json({ message: "all notifications read" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
