const { emailRegex } = require("./config");

///////////////////////////
//Validation Helper Functions
const isEmpty = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

const isEmail = (email) => {
  if (email.match(emailRegex)) return true;
  else return false;
};

exports.validateSignupData = (user) => {
  //Signup Validation
  let errors = {};

  if (isEmpty(user.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(user.email)) {
    errors.email = "Must be a valid email address";
  }

  if (isEmpty(user.password)) errors.password = "Must not be empty";
  if (isEmpty(user.handle)) errors.handle = "Must not be empty";
  if (user.password !== user.confirmPassword)
    errors.confirmPassword = "Passwords must match";

  //We return the error object (even if it is empty)
  //If there are any errors, set valid to false
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.validateLoginData = (user) => {
  //Validation
  let errors = {};

  if (isEmpty(user.email)) errors.email = "Must not be empty";
  if (isEmpty(user.password)) errors.password = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.reduceUserDetails = (data) => {
  let userDetails = {};

  if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
  if (!isEmpty(data.website.trim())) {
    //check if the incoming data's website starts with http or https
    if(data.website.trim().substring(0, 4) !== "http") {
      userDetails.website = `http://${data.website.trim()}`;
    }
    else userDetails.website = data.website.trim();
  }
  if (!isEmpty(data.location.trim())) userDetails.location = data.location;

  return userDetails;
};
