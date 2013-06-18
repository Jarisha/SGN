var StoreController = ['$scope', '$rootScope', '$http', '$location', '$templateCache', 'resolveStore',
  function($scope, $rootScope, $http, $location, $templateCache, resolveStore){
    /* $scope wide variables, binded to view */
    $rootScope.css = 'store';
    $rootScope.title = 'front';
    //$scope.modals = $rootScope.rootPath + '/partials/modals';
    $scope.subnav = $rootScope.rootPath + '/partials/store_subnav';
    $scope.nav = $rootScope.rootPath + '/partials/navbar';
    $scope.content = $rootScope.rootPath + '/partials/store_content';
    $scope.register = {name: null, password: null, confirm: null};
    $scope.login = {name: null, password: null};
    $scope.masonInit = true;
    $scope.bigPin = {};
  
    $scope.changeState = function(){
      $scope.masonInit = false;
    }
  
    $scope.dummyData = [
      {
        name: 'Minecraft',
        price: 'Free',
        publisher: 'Mojang',
        image: "http://localhost/images/game_images/store_img2.png",
        screenshot: "https://minecraft.net/images/mobile/desktop_screen4.png",
        video: 'http://youtu.be/FaMTedT6P0I',
        description: "We're extremely happy to finally roll out Minecraft – Pocket Edition on most devices running Android or iOS in the Solar System. Now no matter where you are there's always time to place blocks and build whatever your heart can imagine.",
        category: 'Strategy',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.mojang.minecraftpe',
        platform: 'Android'
      },
      {
        name: 'Great Big War Game',
        price: '$4.99',
        image: "http://localhost/images/game_images/store_img3.png",
        category: 'Strategy',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.rubicon.dev.gbwg',
        platform: 'Android'
      },
      {
        name: 'Angry Birds Space Premium',
        price: 'N/A',
        image: "http://localhost/images/game_images/store_img4.png",
        category: 'Puzzle',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.rovio.angrybirdsspace.premium',
        platform: 'Android'
      },
      {
        name: 'Cut the Rope',
        price: '$0.99',
        image: "http://localhost/images/game_images/store_img5.png",
        category: 'Puzzle',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.zeptolab.ctr.paid',
        platform: 'Android'
      },
      {
        name: 'Move the Box Pro',
        price: '$0.99',
        image: "https://lh3.ggpht.com/hhurG5c5QP9dn6AN80mPdkxrK_0BwsRrNaEnXSANenpoFH0nKXkDJLTLIvAG_5vgdA=w124",
        category: 'Puzzle',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=ua.co.cts.movethebox',
        platform: 'Android'
      },
      {
        name: 'Bomba',
        price: '$0.99',
        image: 'https://lh3.ggpht.com/dKcPug5YXNwEULvix5WMPGjvEEbAFINvbm8Xbko0NRk4S9bdeTGGBxXWKcyUiIiJ9-Y=w124',
        category: 'Puzzle',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.GamesLab.Bomba',
        platform: 'Android'
      },
      {
        name: 'SpellTower',
        price: '$1.99',
        image: 'http://a1.mzstatic.com/us/r1000/092/Purple/v4/49/52/7d/49527d33-52c8-1b0e-7d19-6667853cc697/mza_5638865484617812239.175x175-75.jpg',
        category: 'Puzzle',
        appStoreUrl: 'https://itunes.apple.com/us/app/spelltower/id476500832?mt=8',
        platform: 'iPhone'
      }
    ];
  
    $scope.viewStorePin = function(index){
      $scope.bigPin = $scope.dummyData[index];
      $('#storePinModal').modal({ dynamic: true });
    }

    //Setup non AJAX related javascript
    $scope.setup = function(){
      $rootScope.masonry();
    }
  }
];

StoreController.resolve = {
  resolveStore: ['$q', '$rootScope', '$location', function($q, $rootScope, $location){
    var deferred = $q.defer();
    
    //hack to deal with links from modal windows
    $('#gamePinModal').modal('hide');
    
    $rootScope.checkLogin(function(err, login){
      if(err) deferred.reject(err);
      else if(!login) $location.path('/');
      else deferred.resolve();
    });
    return deferred.promise;
  }]
}