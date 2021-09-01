const { db } = require("../util/admin");

exports.postComment = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ comment: "must not be empty" });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    barkID: req.params.barkID,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
  };

  const barkQuery = db.doc(`/barks/${req.params.barkID}`);
  let barkData;

  barkQuery
    .get()
    .then((doc) => {
      if (!doc.exists)
        return res
          .status(404)
          .json({ error: "404, shibe not found to bark at" });
      barkData = doc.data();
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      res.json(newComment);
      barkData.commentCount++;
      return barkQuery.update({ commentCount: barkData.commentCount });
    })
    .then(() => {
      res.json("new comment successfully barked, comment count updated");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
