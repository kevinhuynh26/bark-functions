const { db } = require("../util/admin");

exports.postOneBark = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ body: "Body mus not be empty" });

  const newBark = {
    userHandle: req.user.handle,
    body: req.body.body,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };

  db.collection("barks")
    .add(newBark)
    .then((data) => {
      const barkWithBarkId = newBark;
      barkWithBarkId.barkID = data.id;
      res.json({ barkWithBarkId, message: `document ${data.id} created` });
    })
    .catch((err) => {
      res.status(500).json({ error: "postBarks error" });
      console.error(`err in postBarks: ${err}`);
    });
};
