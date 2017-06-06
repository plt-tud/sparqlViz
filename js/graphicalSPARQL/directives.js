/// <reference path="../jquery/jquery.d.ts" />
/// <reference path="../angular/angular.d.ts" />
/// <reference path="d3-angular.d.ts" />
angular.module("sparqlJs").directive("node", function () {
    return {
        'restrict': 'A',
        'scope': {
            'node': '='
        },
        'link': function (scope, element) {
            var textElement = element.find('text')[0];
            var size = {
                x: 0,
                y: 0
            };
            scope.$watch(function () {
                var boundingRect = textElement.getBoundingClientRect();
                var w = Math.round(boundingRect.width), h = Math.round(boundingRect.height);
                if (size.x !== w || size.y !== h) {
                    size = {
                        x: w,
                        y: h
                    };
                }
                return size;
            }, function (newSize, oldSize, scope) {
                scope.node.rx = newSize.x;
                scope.node.ry = newSize.y;
            });
        }
    };
}).directive("edge", function () {
    return {
        'restrict': 'A',
        'scope': {
            'edge': '='
        },
        'link': function (scope, element) {
            var textElement = element.find('text')[0];
            var size = {
                x: 0,
                y: 0
            };
            scope.$watch(function () {
                var boundingRect = textElement.getBoundingClientRect();
                var w = Math.round(boundingRect.width), h = Math.round(boundingRect.height);
                if (size.x !== w || size.y !== h) {
                    size = {
                        x: w,
                        y: h
                    };
                }
                return size;
            }, function (newSize, oldSize, scope) {
                scope.edge.size = newSize;
            });
        }
    };
});
