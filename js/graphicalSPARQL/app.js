/// <reference path="../angular/angular.d.ts" />
/// <reference path="../angular/angular.route.d.ts" />
angular.module("sparqlJs", ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/legend', {
            'templateUrl': 'templates/legend.html',
            'controller': 'legendController'
        }).when('/', {
            'templateUrl': 'templates/editor.html',
            'controller': 'graphController'
        }).otherwise({
            'redirectTo': '/'
        });
    }]);
