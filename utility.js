/* utility.js contains conflict resolution, nodeflake ID generation, and other useful
 * functions used here and there.
 */

//TODO: Give Quyay API callback in callback(err, success) format
var app = require('./app');
var http = require('http');
var random = require('secure_random');
var bcrypt = require('bcrypt-nodejs');
var config = require('./config');

var clone = exports.clone = function(obj){
  if(obj == null || typeof(obj) != 'object')
      return obj;

  var temp = obj.constructor(); // changed

  for(var key in obj)
      temp[key] = clone(obj[key]);
  return temp;
}

//Takes in array and returns new one with duplicate entries removed
function arrNoDupe(a) {
    var temp = {};
    for (var i = 0; i < a.length; i++)
        temp[a[i]] = true;
    var r = [];
    for (var k in temp)
        r.push(k);
    return r;
}

//returns date in mm/dd/yyyy format
//TODO: Evaluate if this is good enough
var getDate = exports.getDate = function(){
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1;
  var yyyy = today.getFullYear();
  today = mm+'/'+dd+'/'+yyyy;
  return today;
}

