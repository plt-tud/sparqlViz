/// <reference path="../../node_modules/@types/angular/index.d.ts" />
/// <reference path="../../node_modules/@types/angular-route/index.d.ts" />

angular.module("sparqlJs", [
    'ngRoute',
    'ngStorage',

    ])
    .config(['$routeProvider', function($routeProvider: angular.route.IRouteProvider)
    {
        $routeProvider.when('/legend', {
            'templateUrl': 'templates/legend.html',
            'controller': 'legendController'
        }).when('/settings', {
            'templateUrl': 'templates/settings.html',
            'controller': 'settingsController'
        }).when('/', {
            'templateUrl': 'templates/editor.html',
            'controller': 'graphController'
        }).otherwise({
            'redirectTo': '/'
        })
    }]);