console.log('first');
var userApi = require('./api/user');
var gamepinApi = require('./api/gamepin');
var baseApi = require('./api/base');

module.exports = function(app){
  /********* Quyay API ***********/
  //temporary
  app.get('/api/fixProblems', userApi.fixProblems);
  
  //User
  //Debug only
  app.post('/api/user/createUser', userApi.createWrap);
  app.post('/api/user/editUser', userApi.editWrap);
  app.post('/api/user/deleteUser', userApi.deleteWrap);
  app.post('/api/user/fetchUser', userApi.fetchUser);
  app.post('/api/user/fetchUsers', userApi.fetchUsers);
  app.get('/api/user/fetchEvent', baseApi.fetchEvent);
  app.post('/api/user/deleteEvent', baseApi.deleteEvent);

  
  app.post('/api/user/getProfile', userApi.getProfile);
  app.post('/api/user/getGroups', userApi.getGroups);
  app.post('/api/user/getLikedPins', userApi.getLikedPins);
  //end debug
  
  //********** Test API ***************/
  app.get('/api/user/testAPI', userApi.testAPI);
  
  //new api calls
  app.post('/api/user/deactivate', userApi.deleteWrap);
  app.post('/api/user/follow', userApi.follow);
  app.post('/api/user/unfollow', userApi.unfollow);
  
  app.get('/api/facebookRegister', userApi.facebookRegister);
  app.post('/api/facebookRegister', userApi.facebookRegister);
  app.post('/api/login', userApi.login);
  //
  app.post('/api/gatewayLogin', userApi.gatewayLogin);
  //
  app.post('/api/logout', userApi.logout);
  app.post('/api/register', userApi.register);
  app.post('/api/register_2', userApi.register_2);
  app.post('/api/checkLogin', userApi.checkLogin);
  app.post('/api/getSettings', userApi.getSettings);
  app.post('/api/editSettings', userApi.editSettings);
  app.post('/api/deactivate', userApi.deleteWrap);
  
  app.get('/api/getPath', userApi.getPath);
  app.post('/api/getProfile', userApi.getProfile);
  app.post('/api/getFollowers', userApi.getFollowers);
  app.post('/api/getPinList', userApi.getPinList);
  app.post('/api/categorySearch', userApi.categorySearch);
  app.post('/api/textSearch', userApi.textSearch);
  app.post('/api/getUser', userApi.getUser);
  app.post('/api/uploadAvatar', userApi.uploadAvatar);
  app.post('/api/changeAvatar', userApi.changeAvatar);
  app.post('/api/sendEmail', userApi.sendEmail);
  
  //Fetch Profile data
  app.get('/api/getActivity/:userName', userApi.getActivity);
  app.get('/api/getGroups/:userName', userApi.getGroups);
  
  //alpha registration based api calls
  app.post('/api/createPending', userApi.createPending);
  app.post('/api/acceptAccount', userApi.acceptPending);
  app.post('/api/setPassword', userApi.setPassword);
  app.post('/api/checkUniqueName', userApi.checkUniqueName);
  app.post('/api/checkUniqueEmail', userApi.checkUniqueEmail);
  //Gamepin
  
  //degug
  app.post('/api/gamepin/createGamepin', gamepinApi.createWrap);
  app.post('/api/gamepin/editGamepin', gamepinApi.editWrap);
  app.post('/api/gamepin/deleteGamepin', gamepinApi.deleteWrap);
  app.post('/api/gamepin/fetchGamepin', gamepinApi.fetchGamepin);
  
  //app.post('/api/gamepin/postGamePin', gamepinApi.postGamePin);
  app.post('/api/gamepin/postImageUpload', gamepinApi.postImageUpload);
  app.post('/api/gamepin/postImageUrl', gamepinApi.postImageUrl);
  app.post('/api/gamepin/postYoutubeUrl', gamepinApi.postYoutubeUrl);
  app.post('/api/gamepin/edit', gamepinApi.edit);
  app.post('/api/gamepin/remove', gamepinApi.remove);
  app.post('/api/gamepin/getComments', gamepinApi.getComments);
  app.post('/api/gamepin/addComment', gamepinApi.addComment);
  app.post('/api/gamepin/editComment', gamepinApi.editComment);
  app.post('/api/gamepin/like', gamepinApi.like);
  app.post('/api/gamepin/unlike', gamepinApi.unlike);
  app.post('/api/gamepin/share', gamepinApi.share);
  app.post('/api/gamepin/search', gamepinApi.search);
  app.post('/api/gamepin/getPinData', gamepinApi.getPinData);
  
  //misc
  app.post('/api/util/validImg', baseApi.validImg);
  app.post('/api/util/validVideo', baseApi.validVideo);
  app.post('/api/util/reindexGamepins', baseApi.reindexGamepins);
  app.post('/api/util/reindexUsers', baseApi.reindexUsers);
  app.post('/api/util/reindexComments', baseApi.reindexComments);
}