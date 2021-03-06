/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/angular/index.d.ts" />
/// <reference path="../../node_modules/@types/d3/index.d.ts" />
/// <reference path="../../node_modules/@types/socket.io-client/index.d.ts" />
/// <reference path="../graphicalSPARQL/classes.ts" />

angular.module('sparqlJs').factory("config", function($localStorage, $location) {

    return $localStorage.$default({
        sparqlLogProxyUrl: $location.protocol() + "://" + $location.host() + ":5060"
    });

});


// https://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
angular.module('sparqlJs').factory('socket', function ($rootScope, config) {
    var socket = io(config.sparqlLogProxyUrl);
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});


angular.module("sparqlJs").factory('highlightingService', [function()
{
    var highlightedSubGraph: sparql.SubGraph = null,
        highlightedFilter:  sparql.Filter    = null,
        highlightedBind:    sparql.Bind      = null,
        highlightedUnion:   sparql.Union     = null,
        highlightedOrder:   sparql.Order     = null,
        highlightedService: sparql.Service   = null;

    return {
        highlight(object): void
        {
            if(object instanceof sparql.SubGraph)
            {
                highlightedSubGraph = object;
            }
            else if(object instanceof sparql.Filter)
            {
                highlightedFilter = object;
            }
            else if(object instanceof sparql.Bind)
            {
                highlightedBind = object;
            }
            else if(object instanceof sparql.Union)
            {
                highlightedUnion = object;
            }
            else if(object instanceof  sparql.Order)
            {
                highlightedOrder = object;
            }
            else if(object instanceof sparql.Service)
            {
                highlightedService = object;
            }
            else
            {
                highlightedSubGraph = highlightedFilter = highlightedBind = highlightedUnion = highlightedOrder = highlightedService = null;
            }
        },
        isHighlighted(object): boolean
        {
            if( highlightedSubGraph === null && highlightedFilter  === null && 
                highlightedBind     === null && highlightedUnion   === null && 
                highlightedOrder    === null && highlightedService === null
            ) {
                return true;
            }
            else if(object instanceof sparql.SubGraph)
            {
                return highlightedSubGraph === object;
            }
            else if(object instanceof sparql.Filter)
            {
                return highlightedFilter === object;
            }
            else if(object instanceof sparql.Bind)
            {
                return highlightedBind === object;
            }
            else if(object instanceof sparql.Union)
            {
                return highlightedUnion === object;
            }
            else if(object instanceof  sparql.Order)
            {
                return highlightedOrder === object;
            }
            else if(object instanceof sparql.Service)
            {
                return highlightedService === object;
            }
            else if(object instanceof sparql.Node)
            {
                return $.inArray(highlightedSubGraph, object.getSubGraphList()) >= 0 ||
                       $.inArray(highlightedFilter,   object.getFilterList())   >= 0 ||
                       $.inArray(highlightedBind,     object.getBindList())     >= 0 ||
                       $.inArray(highlightedUnion,    object.getUnionList())    >= 0 ||
                       $.inArray(highlightedOrder,    object.getOrderList())    >= 0 ||
                       $.inArray(highlightedService,  object.getServiceList())  >= 0;
            }
            else if(object instanceof sparql.Edge)
            {
                return (highlightedSubGraph === object.getSubgraph() && object.getSubgraph() !== null) ||
                       (highlightedService  === object.getService()  && object.getService()  !== null) ||
                       $.inArray(highlightedFilter, object.getFilterList()) >= 0 ||
                       $.inArray(highlightedBind,   object.getBindList())   >= 0 ||
                       $.inArray(highlightedUnion,  object.getUnionList())  >= 0 ||
                       $.inArray(highlightedOrder,  object.getOrderList())  >= 0;
            }

            return false;
        }
    }
}]).factory('dragNodeService', [function()
{
    var forceLayout: any;
    var dragNode: sparql.Node = null,
        positionOnStart: [number, number] = [0, 0],
        position: [number, number] = [0, 0];

    return {
        setForceLayout(force: any) {
            forceLayout = force;
        },
        dragNode(node: sparql.Node, event: JQueryEventObject) {
            if(node !== null)
            {
                positionOnStart[0] = node.x;
                positionOnStart[1] = node.y;

                position[0] = event.pageX;
                position[1] = event.pageY;
            }

            dragNode = node;
        },
        moveNode(event: JQueryEventObject) {
            if(dragNode !== null)
            {
                dragNode.x = positionOnStart[0] + event.pageX - position[0];
                dragNode.y = positionOnStart[1] + event.pageY - position[1];
            }
        }
    }
}]);
