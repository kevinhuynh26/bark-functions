const { db } = require("../util/admin");

exports.getOneBark = (req, res) => {
  let barkData = {};
  db.doc(`/barks/${req.params.barkID}`)
    .get()
    .then((doc) => {
      if (!doc.exists)
        return res.status(404).json({ error: "404, no bark here" });

      barkData = doc.data();
      barkData.barkID = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("barkID", "==", req.params.barkID)
        .get();
    })
    .then((data) => {
      barkData.comments = [];
      data.forEach((element) => {
        barkData.comments.push(element.data());
      });
      return res.json(barkData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err });
    });
};

exports.deleteOneBark = (req, res) => {
  const docQuery = db.doc(`/barks/${req.params.barkID}`);

  docQuery
    .get()
    .then((doc) => {
      console.log(doc.data());
      if (!doc.data()) {
        return res.status(404).json({ error: "Bark not found" });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: "Unauthorized User" });
      } else {
        return docQuery.delete();
      }
    })
    .then(() => {
      res.json({ message: "Bark has been deleted" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
