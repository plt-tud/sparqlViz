/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/angular/index.d.ts" />
/// <reference path="../../node_modules/@types/d3/index.d.ts" />
/// <reference path="../graphicalSPARQL/classes.ts" />


angular.module('sparqlJs').controller('settingsController', function ($scope, $location, config) {
    $scope.config = config;
    $scope.$location = $location;
});
angular.module("sparqlJs").controller("graphController", function($scope: graphControllerScope, socket, highlightingService, dragNodeService, parseQueryService, $location, sparqlProxyService) {
    $scope.nodes = [];
    $scope.edges = [];
    $scope.subGraphs = [];
    $scope.filters = [];
    $scope.binds = [];
    $scope.unions = [];
    $scope.orders = [];
    $scope.services = [];
    $scope.limit = Infinity;
    $scope.queries = sparqlProxyService.sparqlRequests;
    $scope.selectedQuery = null;

    socket.on('request', function (data) {
        console.log("Message", data);
        $scope.queries.push(data);
        if ($scope.queries.length>20)
            $scope.queries.shift();
    });

    $scope.selectQuery = function(query){
        console.log("Select Query", query);
        if (query) {
            if ($scope.selectedQuery) {
                $scope.selectedQuery.isActive = false;
            }

            query.isActive = true;
            $scope.selectedQuery = query;
            parseQueryService.parse(query.query);
            console.log($scope.queries);
        }
    };

    sparqlProxyService.update();

    $scope.$watch("queries[0]", function(newVal, oldVal, scope){
        console.log("hit")
        if (newVal && $scope.selectedQuery==null) {
            console.log("new", newVal)
            $scope.selectQuery(newVal);
        }
    });

    $scope.$watch("parseQueryService.getObject()", function(newQuery: sparql.Query)
    {
        if(newQuery === null) return;

        $scope.nodes = newQuery.getNodeList();
        $scope.edges = newQuery.getEdgeList();
        $scope.subGraphs = newQuery.getSubGraphList();
        $scope.filters = newQuery.getFilterList();
        $scope.binds = newQuery.getBindList();
        $scope.unions = newQuery.getUnionList();
        $scope.orders = [newQuery.getOrder()];
        $scope.services = newQuery.getServiceList();
        $scope.limit = newQuery.getLimit();

        if($scope.orders[0] === null)
        {
            $scope.orders = [];
        }

        var numberOfNodes = $scope.nodes.length;
        var source, target, numberOfLinksList = new Array(numberOfNodes * numberOfNodes);

        // Stores the number of links between two nodes
        for(var numberOfLinks = 0; numberOfLinks < numberOfLinksList.length; numberOfLinks++)
        {
            numberOfLinksList[numberOfLinks] = 0;
        }

        for(var edge of $scope.edges)
        {
            for(var nodeId in $scope.nodes)
            {
                if(!$scope.nodes.hasOwnProperty(nodeId)) continue;

                if($scope.nodes[nodeId] == edge.getStartNode())
                {
                    source = parseInt(nodeId);
                }
                else if($scope.nodes[nodeId] == edge.getEndNode())
                {
                    target = parseInt(nodeId);
                }
            }

            edge.source = source;
            edge.target = target;

            // For the graph with n nodes, the number of nodes connecting node k and node j (with k <= j) the position is stored on
            // position k * n + j
            var posInList = Math.min(target, source) * numberOfNodes + Math.max(target, source);

            if(numberOfLinksList[posInList] === 1)
            {
                edge.setType(sparql.GraphEdgeType.BEZIER_POSITIVE);
            }
            else if(numberOfLinksList[posInList] > 0)
            {
                edge.setType(sparql.GraphEdgeType.BEZIER_NEGATIVE);
            }

            numberOfLinksList[posInList]++;
        }

        $scope.graphSize = {height: 0, width: 0};


        $scope.graphSize.height = 600;
        $scope.graphSize.width = 700;

        var force = d3.layout.force()
            .size([$scope.graphSize.width, $scope.graphSize.height]);

        force.nodes($scope.nodes)
            .links($scope.edges)
            .linkDistance(200)
            .linkStrength(1)
            .charge(30)
            .gravity(0.5)
            .start();

        force.on('tick', function()
        {
            for(var n of $scope.nodes)
            {
                if(n.getX() < n.getEllipseParameterX())
                {
                    n.x = n.getEllipseParameterX();
                }
                else if(n.getX() > ($scope.graphSize.width - n.getEllipseParameterX()))
                {
                    n.x = $scope.graphSize.width - n.getEllipseParameterX();
                }

                if(n.getY() < n.getEllipseParameterY())
                {
                    n.y = n.getEllipseParameterY();
                }
                else if(n.getY() > ($scope.graphSize.height - n.getEllipseParameterY()))
                {
                    n.y = $scope.graphSize.height - n.getEllipseParameterY();
                }
            }

            for(var e of $scope.edges)
            {
                e.updateCenterPoint();
                e.updateInterjectionPoint();
            }

            $scope.$apply();
        });
        dragNodeService.setForceLayout(force);
    });

    $scope.highlightService = highlightingService;
    $scope.dragNodeService = dragNodeService;
    $scope.parseQueryService = parseQueryService;
    $scope.$location = $location;
}).controller('legendController', ['$scope', function($scope, $location) {
    $scope.$location = $location;
}]);