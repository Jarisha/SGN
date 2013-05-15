function settingsSetup($scope){
  console.log('settingsSetup');
  /* Setup modals */
  $scope.postGamePin = function(){
    $('#pinModal_1').modal();
  }
}