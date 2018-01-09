var updateSocketFunction;

angular.module('starter.controllers', [])

.controller('AppCtrl', function ($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function (modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function () {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function () {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function () {
    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function () {
      $scope.closeLogin();
    }, 1000);
  };
})


.controller('HomeCtrl', function ($scope, $stateParams, $ionicPopup, $state) {
  $scope.youlose = function () {
    $ionicPopup.alert({
      cssClass: 'removedpopup',
      title: "Sorry",
      template: "You Lose",
      buttons: [{
        text: 'OK',
        // cssClass: 'leaveApp',
        onTap: function (e) {}
      }, ]
    });
  };

  $scope.youwin = function () {
    $ionicPopup.alert({
      cssClass: 'removedpopup',
      title: "Hurray",
      template: "You Won",
      buttons: [{
        text: 'OK',
        // cssClass: 'leaveApp',
        onTap: function (e) {}
      }, ]
    });
  };

  $scope.fold = function () {
    $ionicPopup.alert({
      cssClass: 'removedpopup',
      title: "Fold",
      template: "Your cards are folded",
      buttons: [{
        text: 'OK',
        // cssClass: 'leaveApp',
        onTap: function (e) {}
      }, ]
    });
  };

})

.controller('DealerCtrl', function ($scope, $stateParams, apiService, $state, $timeout, $ionicModal) {

  io.socket.on("ShowWinner", function (data) {});
  $scope.randomCard = function () {
    apiService.randomCard();
  };

  updateSocketFunction = function (data) {
    $scope.turnPlayer = _.find(data.playerCards, function (player) {
      return player.isTurn;
    });
    //cardServed
    $scope.cardServed = data.cardServed;
    $scope.communityCards = data.communityCards;
    $scope.gameType = data.currentGameType;
    $scope.playersChunk = _.chunk(data.playerCards, 8);
    $scope.extra = data.extra;
    $scope.hasTurn = data.hasTurn;
    $scope.isCheck = data.isCheck;
    $scope.showWinner = data.showWinner;
    $scope.$apply();
    $scope.modal3.hide();
  };

  io.socket.on("Update", updateSocketFunction);


  // $scope.pageChange = function () {};


  $scope.updatePlayers = function () {
    apiService.getAll(function (data) {
      // check whether dealer is selected or not

      var dealerIndex = _.findIndex(data.data.data.playerCards, function (player) {
        return player.isDealer;
      });
      $scope.turnPlayer = _.find(data.data.data.playerCards, function (player) {
        return player.isTurn;
      });
      if (dealerIndex < 0) {
        // $scope.noDealer = true;
        $state.go("table");
      }

      $scope.communityCards = data.data.data.communityCards;
      $scope.cardServed = data.data.data.cardServed;
      $scope.gameType = data.data.data.currentGameType;
      $scope.playersChunk = _.chunk(data.data.data.playerCards, 8);
      $scope.hasTurn = data.data.data.hasTurn;
      $scope.isCheck = data.data.data.isCheck;
      $scope.showWinner = data.data.data.showWinner;
    });
  };

  $scope.updatePlayers();
  $scope.showCards = function () {
    apiService.revealCards(function (data) {});
  };

  io.socket.on("sideShow", function (data) {
    $scope.modal3.show();
    $scope.message = {
        content: "Side show has been requested from Player-" + data.data.fromPlayer.playerNo + " to Player-" + data.data.toPlayer.playerNo,
        color: "color-balanced"
      }
      // $timeout(function () {
      //   $scope.modal3.hide();
      // }, 5000);
  });

  io.socket.on("sideShowCancel", function (data) {
    $scope.modal3.show();
    $scope.message = {
      content: "Side show has been denied !!",
      color: "color-assertive"
    }
    $timeout(function () {
      $scope.modal3.hide();
    }, 3000);
  });

  $ionicModal.fromTemplateUrl('templates/modal/toastr.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.modal3 = modal;
  });

  var count = 0;
  var counter = 0;
  $scope.selected = '0-0';
  $scope.currentPlayer = 0;

  // Modal Actions
  $ionicModal.fromTemplateUrl('templates/modal/sure.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.modal = modal;
  });

  $scope.confirmModalClose = function () {
    $scope.modal.hide();
  };

  $scope.showConfirmationModal = function (value) {
    switch (value) {
      case "sideShow":
        $scope.confirmModalOk = $scope.sideShow;
        $scope.modelActionFor = "Side Show";
        break;
      case "fold":
        $scope.confirmModalOk = $scope.fold;
        $scope.modelActionFor = "Fold";
        break;
      case "newGame":
        $scope.confirmModalOk = $scope.newGame;
        $scope.modelActionFor = "Start New Game";
        break;
      case "undo":
        $scope.confirmModalOk = $scope.undo;
        $scope.modelActionFor = "Undo";
        break;
      case "showWinner":
        $scope.confirmModalOk = $scope.showWinnerPlayer;
        $scope.modelActionFor = "Show Winner";
        break;
    }
    $scope.modal.show();
  };

  // Turn Actions
  $scope.allIn = function () {
    apiService.allIn(function (data) {});
  };
  $scope.fold = function () {
    apiService.fold(function (data) {});
  };
  $scope.sideShow = function () {
    apiService.sideShow(function (data) {});
  }


  $scope.makeSeen = function () {

    apiService.makeSeen(function (data) {});
  };

  $scope.move = function () {
    apiService.move(function (data) {});
  };

  $scope.showWinnerPlayer = function () {
    $state.go('winner');
  };
  // New Game
  $scope.newGame = function () {
    $state.go("table");
  };

  // Undo
  $scope.undo = function () {
    apiService.undo(function (data) {});
  };

  // Remove Cards
  $scope.removeCard = function (cardNo) {
    apiService.removeCard(cardNo);
  };
  $scope.showRemove = function (cardNo) {
    if ($scope.communityCards && $scope.communityCards.length == 8) {
      if (cardNo === 0) {
        if ($scope.communityCards[0].cardValue !== "" && $scope.communityCards[4].cardValue === "") {
          return true;
        }
      } else if (cardNo === 4) {
        if ($scope.communityCards[4].cardValue !== "" && $scope.communityCards[6].cardValue === "") {
          return true;
        }
      } else if (cardNo === 6) {
        if ($scope.communityCards[6].cardValue !== "") {
          return true;
        }
      }
    }
  };
})

.controller('TableCtrl', function ($scope, $stateParams, apiService, $state) {
  io.socket.off("Update", updateSocketFunction);
  $scope.newGame = function () {
    $scope.winnerData = {};
    apiService.newGame(function (data) {
      $scope.updatePlayers();
    });
  };

  $scope.makeGameType = function (data) {
    apiService.makeGameType(data, function () {});
  };

  $scope.newGame();

  $scope.updatePlayers = function () {
    apiService.getAll(function (data) {
      $scope.allPlayers = data.data.data.playerCards;
      $scope.playersChunk = _.chunk(data.data.data.playerCards, 8);
      _.each($scope.allPlayers, function (n) {
        if (n.isDealer) {
          $scope.dealer = {
            dealerPlayer: n.playerNo
          };
        }
      });
    });
  };

  $scope.makeDealer = function (tabId) {
    apiService.makeDealer({
      "tabId": tabId,
      isStraddle: ($scope.form.isStraddle && $scope.activePlayers() > 2)
    }, function (data) {
      $state.go("dealer");
    });
  };

  $scope.activePlayers = function () {
    var players = _.flatten($scope.playersChunk);
    return _.filter(players, function (player) {
      return player.isActive;
    });
  };

  $scope.isDealerPlayerInActive = function (dealerPlayer) {
    var players = _.flatten($scope.playersChunk);
    var dealerPlayerIndex = _.findIndex(players, function (player) {
      return (player.isActive && player.playerNo == dealerPlayer);
    });
    if (dealerPlayerIndex >= 0) {
      return true;
    } else {
      return false;
    }
  };
  $scope.form = {
    isStraddle: false
  };

  //Settings
  apiService.getSettings(function (data) {
    $scope.settings = data.data.results;
  });
  apiService.getGameType(function (data) {
    $scope.gameType = data.data.results;

    var gameSelected = _.find($scope.gameType, function (data) {
      return data.currentType;
    });
    $scope.gameSelected = gameSelected._id;
  });
  $scope.storeSetting = function (data) {
    apiService.storeSettings($scope.settings, function () {});
    var fData = {};
    fData._id = data;
    apiService.makeGameType(fData, function () {});
  };
  $scope.settingShow = false;
  $scope.toggleSettingShow = function () {
    $scope.settingShow = !$scope.settingShow;
  };
  $scope.form.adminurl = apiService.getAdminUrl();
  $scope.saveAdminUrl = function () {
    apiService.saveAdminUrl($scope.form.adminurl);
    window.location.href = window.location.href.split("#")[0];
  };
})

.controller('WinnerCtrl', function ($scope, $stateParams, apiService) {
  io.socket.off("Update", updateSocketFunction);
  $scope.showWinner = function () {
    apiService.showWinner(function (data) {
      $scope.players = data.data.data.winners;
      $scope.gameType = data.data.data.gameType;
      $scope.winners = _.filter($scope.players, function (player) {
        return player.winner;
      });
      $scope.winnerString = _.join(_.map($scope.winners, function (n) {
        return "Player " + n.playerNo;
      }), " & ");
    });
  };

  $scope.showWinner();
});