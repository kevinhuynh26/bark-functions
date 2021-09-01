const { admin, db } = require("./admin");

//Authorization/Authentication middleware
module.exports.FBAuth =  (req, res, next) => {
  //Find the token in the request header
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("no token");
    return res.status(403).json({ error: "Unauthorized Post, Please Log In" });
  }

  //Authorize token from request header with firebase
  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decoded) => {
      /*
      If the token is authorized, we can return a user object within request object
      with the handle attached
      NOTE: verifyIdToken returns a decoded object with information such as the UID and email
      */
      req.user = decoded;
      return db
        .collection("users")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();
    })
    .then((data) => {
      req.user.handle = data.docs[0].data().handle;
      req.user.imageUrl = data.docs[0].data().imageUrl;
      return next();
    })
    .catch((err) => {
      console.error("Error, unverified token");
      return res.status(403).json(err);
    });
};