myApp.factory('apiService', function ($http, $q, $timeout) {
    return {
        // This is a get Players Service for POST Method.
        getall: function (callback) {
            $http({
                url: adminurl + 'Player/getAll',
                method: 'POST'
            }).then(function (data) {
                callback(data);
            });
        },
        getGameType: function (callback) {
            $http.post(adminurl + 'GameType/search', {}).then(function (data) {
                callback(data.data);
            });
        },
        makeGameType: function (data, callback) {
            $http.post(adminurl + 'GameType/makeCurrentType', data).then(function (data) {
                callback(data.data);
            });
        },
        getSettings: function (callback) {
                $http({
                    url: adminurl + 'setting/search',
                    method: 'POST'
                }).then(function (data) {
                    callback(data);
                });
            }
            // This is a get Players Service for POST Method.
    };
});