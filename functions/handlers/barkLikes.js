const { db } = require("../util/admin");

/*
Like & Unlike a Bark!
*/
exports.likeBark = (req, res) => {
  //Query for the Like Database
  const likeQuery = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("barkID", "==", req.params.barkID)
    .limit(1);

  //Query to get one Bark from the Barks database
  //NOTE: THIS IS NOT THE ADDRESS ROUTE, THIS IS THE COLLECTION QUERY
  const barkQuery = db.doc(`/barks/${req.params.barkID}`);

  let barkData;

  //Call the query to get one Bark using the barkID
  barkQuery
    .get()
    .then((doc) => {
      //Check if the bark exists before proceeding
      if (doc.exists) {
        barkData = doc.data();
        barkData.barkID = doc.id;
        //return a promise containing the result of the query to the "like" database
        return likeQuery.get();
      } else {
        console.log("error here");
        return res.status(404).json({ error: "404, bark not found to like" });
      }
    })
    .then((data) => {
      //if the result of the query is EMPTY, that means that the user has not already liked the bark
      //so we enter this block
      if (data.empty) {
        return db
          .collection("likes")
          .add({
            barkID: barkData.barkID,
            userHandle: req.user.handle,
          })
          .then(() => {
            barkData.likeCount++;
            return barkQuery.update({ likeCount: barkData.likeCount });
          })
          .then(() => {
            return res.json(barkData);
          });
      }
      //if the result of the query is NOT EMPTY, the user has previously liked the bark
      //so we must REMOVE the like by removing the document from the 'like' collection
      else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            barkData.likeCount--;
            return barkQuery.update({ likeCount: barkData.likeCount });
          })
          .then(() => {
            res.json(barkData);
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err.code });
    });
};
