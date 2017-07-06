/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/angular/index.d.ts" />

angular.module("sparqlJs").directive("node", function() {
    return {
        restrict: 'A',
        scope: {
            'node': '=',
            'highlight': '='
        },
        templateUrl: 'templates/node.html',
        link: function(scope, element: JQuery) {
            var textElement = element.find('text')[0];
            scope.$watch('node.name', function(newSize, oldSize, scope) {
                var boundingRect = textElement.getBoundingClientRect();
                scope.node.rx = Math.round(boundingRect.width);
                scope.node.ry = Math.round(boundingRect.height);
            });
        }
    };
});

angular.module("sparqlJs").directive("edge", function() {
    return {
        'restrict': 'A',
        'scope': {
            'edge': '=',
            'highlight': '='
        },
        templateUrl: 'templates/edge.html',
        'link': function(scope, element: JQuery) {
            var textElement = element.find('text')[0];
            scope.$watch('edge.text', function(newSize, oldSize, scope) {
                var boundingRect = textElement.getBoundingClientRect();
                scope.edge.size.x = Math.round(boundingRect.width);
                scope.edge.size.y = Math.round(boundingRect.height);
            });
        }
    }
});