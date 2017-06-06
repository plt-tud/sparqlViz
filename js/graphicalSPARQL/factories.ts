/// <reference path="../jquery/jquery.d.ts" />
/// <reference path="../angular/angular.d.ts" />
/// <reference path="../d3/d3.d.ts" />
/// <reference path="d3-angular.d.ts" />
/// <reference path="../graphicalSPARQL/classes.ts" />

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
    var forceLayout: d3.layout.Force<d3.layout.force.Link<d3.layout.force.Node>, d3.layout.force.Node>;
    var dragNode: sparql.Node = null,
        positionOnStart: [number, number] = [0, 0],
        position: [number, number] = [0, 0];

    return {
        setForceLayout(force: d3.layout.Force<d3.layout.force.Link<d3.layout.force.Node>, d3.layout.force.Node>) {
            forceLayout = force;
        },
        dragNode(node: sparql.Node, event: JQueryEventObject) {
            if(node !== null)
            {
                positionOnStart[0] = node.getX();
                positionOnStart[1] = node.getY();

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

                forceLayout.resume();
            }
        }
    }
}]);
