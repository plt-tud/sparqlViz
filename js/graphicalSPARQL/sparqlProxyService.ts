/**
 * Created by mgraube on 23.05.17.
 */

angular.module('sparqlJs').factory('sparqlProxyService', function ($http, config) {

    var sparqlRequests = [];

    var update = function() {
        console.log("Proxy Provider: update data from server", config.sparqlLogProxyUrl);

        $http.get(config.sparqlLogProxyUrl, {timeout: 5000}).then(
            function successCallback(response) {
                //sparqlRequests = response.data;
                angular.copy(response.data, sparqlRequests);
                console.log("New Entries from server", sparqlRequests);
            },
            function errorCallback(err) {
                console.log(err);
            }
        );
    };
    return {
        sparqlRequests: sparqlRequests,
        update: update
    }
});