const { db } = require("../util/admin");

exports.getAllBarks = (req, res) => {
  db.collection("barks")
    .orderBy("createdAt", "desc")
    .get()
    .then((query) => {
      let barkArray = [];
      query.forEach((doc) => {
        barkArray.push({
          barkID: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          userImage: doc.data().userImage,
		  commentCount: doc.data().commentCount,
		  likeCount: doc.data().likeCount
        });
        //console.log(data.data());
      });
      return res.json(barkArray);
    })
    .catch((err) => {
      console.error(err);
    });
};
