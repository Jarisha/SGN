Object Schemas

Our goal is to create objects that can easily be changed, and yet also stay in a correct and valid state.

Object Schemas are used to enforce a strict set of properties and validation tests upon any object.

Object Schemas will NOT put or get objects from Riak directly, but only modify them.  We pass in the objects to be modified, and modify them,
returning false on success, and error message on failure.  Javascript Objects are pass by reference.

Whenever we change the schema, we will update the version.  This way, we can immediately determine if an object is out of date
and then reindex it.

We use OO javascript to create and validate an object

Ex 1: Create User

//Create user returns a JS object containing data.  The caller of this function will save the data into riak.
//Returns (error, null) on error, (null, usr) on success.

userSchema = require('userSchema');

function createUser(input, callback){
  var usr = new userSchema.user(input);
  usr.validate(function(err){
    if(err) return callback(err, null);
    return callback(null, usr);
  });
}

Ex 2: Update User

//update user takes in a valid RObject and overwrites RObject.data with input data.
//if the resulting is data is valid, return the modified RObject to be saved.
//Returns error message on error, false on success

function updateUser(RObject, input, callback){
  util.overwrite(RObject.data, input);
  var usr = new userSchema.user(RObject.data);
  usr.validate(function(err){
    if(err) return callback(err);
    return callback(false);
  });
}

Ex 3: Add Follower (add target friend to src user).  Add an element to both RObjects and return them to be saved.

//this is a generic pattern used to update any array
//Returns error message on error, false on success

function addFollower(sourceRObject, targetRObject, callback){
  var sourceEmail = sourceRObject.key;
  var targetEmail = targetRObject.key;
  sourceRObject.data.following.push(targetEmail);
  targetRObject.data.followers.push(sourceEmail);
  var src = new user(sourceRObject.data);
  var trg = new user(targetRObject.data);
  src.validate(function(err){
    if(err) callback(err);
    trg.validate(function(err_2){
      if(err_2) callback(err_2);
      return callback(false);
    });
  });
}

Ex 4: Delete Target User

//this function is destroying all references to this user: Followers, Following, Gamepins
//Returns error message on error, false on success

function deleteUser(targetEmail, ROFollowers, ROFollowing, ROGamepins, callback){
  //loop through all followers, delete user
  for(var f in ROFollowers){
    var following = ROFollowers.data.following;
    following.splice(following.indexOf(targetEmail), 0);
  }
  for(var f in ROFollowing){
    var followers = ROFollowing.data.followers;
    followers.splice(followers.indexOf(targetEmail), 0);
  }
  for(var g in ROGamepins){
    ROGamepins[g].poster = 'deleted';
  }
  callback(ROFollowers, ROFollowing, ROGamepins);
}

Ex 5: Add Event To User's Activity (No validations yet)

function addEvent(ROActivity, evtId){
  ROActivity.data.evtIds.push(evtId);
}