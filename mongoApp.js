var databaseUrl = "mydb"; // "username:password@example.com/mydb"
var collections = ["users", "reports"]
var db = require("mongojs").connect(databaseUrl, collections);

db.users.find({sex: "female"}, function(err, users) {
  if( err || !users) console.log("No female users found");
  else users.forEach( function(femaleUser) {
    console.log(femaleUser);
  } );
});

db.users.save({email: "srirangan@gmail.com", password: "iLoveMongo", sex: "male"}, function(err, saved) {
  if( err || !saved ) console.log("User not saved");
  else console.log("User saved");
});

db.users.update({email: "srirangan@gmail.com"}, {$set: {password: "iReallyLoveMongo"}}, function(err, updated) {
  if( err || !updated ) console.log("User not updated");
  else console.log("User updated");
});