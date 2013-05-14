function aboutSetup($scope){
  /* Setup modals */
  $scope.promptLogin = function(){
    $('#loginModal').modal();
  }
  $scope.promptRegister = function(){
    $('#registerModal').modal();
  }
}