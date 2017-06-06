/**
 * Created by mgraube on 23.05.17.
 */

angular.module('sparqlJs').factory('sparqlProxyService', function ($http) {

    var provider : object = {};

    provider.sparqlRequests = [];

    provider.update = function() {
        console.log("Proxy Provider: update data from server");

        $http.get("http://eatld.et.tu-dresden.de/queries/", {timeout: 5000}).then(
            function successCallback(response) {
                var diff = response.data.filter(function(x) {
                    return provider.sparqlRequests.findIndex(function(item) {return item.uid === x.uid})==-1;
                });

                diff.forEach(function(item) {
                    provider.sparqlRequests.push(item);
                });
                console.log("New Entries from server", diff);
            },
            function errorCallback(err) {
                console.log(err);
            }
        );
    };
    return provider
});