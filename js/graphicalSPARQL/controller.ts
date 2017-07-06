/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/angular/index.d.ts" />
/// <reference path="../../node_modules/@types/d3-force/index.d.ts" />
/// <reference path="../graphicalSPARQL/classes.ts" />


angular.module('sparqlJs').controller('settingsController', function ($scope, $location, config) {
    $scope.config = config;
    $scope.$location = $location;
});

angular.module("sparqlJs").controller("graphController", function($scope, socket, highlightingService, dragNodeService, parseQueryService, $location, sparqlProxyService) {
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
    $scope.selectedQuery = { query: "SELECT ?a WHERE { GRAPH <http://test.com> {?a ?b ?c. ?a rdfs:label ?d. ?d ?e ?c.} GRAPH <http://test.com/2> {?e ?b ?c. ?c ?e ?f.}}"};
    $scope.truncateLength = 250;

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

    $scope.update = function() {
        parseQueryService.parse($scope.selectedQuery.query);
    };

    sparqlProxyService.update();

    $scope.$watch("queries[0]", function(newVal, oldVal, scope){
        if (newVal && $scope.selectedQuery==null) {
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

        $scope.graphSize = {width: 900, height: 600};


        var force = d3.forceSimulation()
            //.size([$scope.graphSize.width, $scope.graphSize.height]);

        //force
            .nodes($scope.nodes)
            .force("center", d3.forceCenter($scope.graphSize.width/2,$scope.graphSize.height/2))
            .force("charge", d3.forceManyBody().strength(-1))
            .force("collide", d3.forceCollide().radius(100))
            .force("link", d3.forceLink($scope.edges).strength(0.2))
           // .force("container", d3.forceContainer([[0, 0],[$scope.graphSize.width, $scope.graphSize.height]]))
            .on("tick", ticked)
            .on("end", function() {console.log("simulation finished", $scope.edges, this.nodes())});
        ;

        function ticked()
        {
            //console.log("tick", $scope.nodes, $scope.edges)
            for(var e of $scope.edges)
            {
                e.updateCenterPoint();
                e.updateInterjectionPoint();
            }

            $scope.$apply();
        }
        //dragNodeService.setForceLayout(force);
    });

    $scope.highlightService = highlightingService;
    $scope.dragNodeService = dragNodeService;
    $scope.parseQueryService = parseQueryService;
    $scope.$location = $location;
});

angular.module("sparqlJs").controller('legendController', ['$scope', function($scope, $location) {
    $scope.$location = $location;
}]);