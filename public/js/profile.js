/* 
  Profile page JS
*/

function profileSetup($scope){
  console.log('profileSetup');
  /* Setup modals */
  $scope.postGamePin = function(){
    $('#pinModal_1').modal();
  }
}