var updateSocketFunction = {};
myApp.controller('HomeCtrl', function ($scope, TemplateService, NavigationService, $timeout, apiService, $uibModal) {
    $scope.template = TemplateService.getHTML("content/home.html");
    TemplateService.title = "Home"; //This is the Title of the Website
    TemplateService.header = ""; //This is the Title of the Website
    TemplateService.footer = ""; //This is the Title of the Website
    $scope.navigation = NavigationService.getNavigation();
    updateSocketFunction = function (data) {
        $scope.cardServed = data.cardServed;
        $scope.gameType = data.currentGameType;
        $scope.player = data.playerCards;
        $scope.extra = data.extra;
        $scope.hasTurn = data.hasTurn;
        $scope.isCheck = data.isCheck;
        $scope.showWinner = data.showWinner;
        console.log('**** inside function_name of TM_FILENAME ****', data);
        if (data.extra.newGame) {
            $scope.removeWinner();
            $scope.getSettings();
        }
        if (data.undo) {
            $scope.removeWinner();
        }
        if (data.extra && (data.extra.player || data.extra.community)) {
            var x = document.getElementById("cardAudio");
            x.play();
        }
        $scope.$apply();
    };

    apiService.getGameType(function (data) {
        $scope.gameType = data.data.results;
        var gameSelected = _.find($scope.gameType, function (data) {
            return data.currentType;
        });
        $scope.gameSelected = gameSelected._id;
    });

    $scope.updatePlayers = function () {
        apiService.getall(function (data) {
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

    $scope.getSettings = function () {
        apiService.getSettings(function (data) {
            $scope.settings = data.data.data.results;
        });
    };

    $scope.getSettings();


    var winnerPopup;
    $scope.showWinnerSocket = function (data) {
        console.log(data);
        if (winnerPopup) {
            winnerPopup.close();
        }
        $scope.winner = data.data.winners;
        console.log($scope.winner);
        winnerPopup = $uibModal.open({
            templateUrl: "views/modal/winner.html",
            size: "lg",
            windowClass: "winner-modal",
            scope: $scope
        });
    };
    $scope.removeWinner = function () {
        if (winnerPopup) {
            winnerPopup.close();
        }
    };
    io.socket.on("Update", updateSocketFunction);
    io.socket.on("showWinner", $scope.showWinnerSocket);
});