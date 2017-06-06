/// <reference path="../jquery/jquery.d.ts" />
/// <reference path="../angular/angular.d.ts" />
/// <reference path="../d3/d3.d.ts" />
/// <reference path="d3-angular.d.ts" />
/// <reference path="../sparql-js/sparqljs.d.ts" />
angular.module("sparqlJs").factory('parseQueryService', [function () {
        var parser = sparqljs.Parser();
        var query = null;
        var objectify = function (queryJson) {
            var object = new sparql.Query();
            var generator = sparqljs.Generator();
            var nodes = [], subGraphs = [];
            var getGraph = function (name) {
                if (!subGraphs.hasOwnProperty(name)) {
                    subGraphs[name] = new sparql.SubGraph(name);
                    object.addSubGraph(subGraphs[name]);
                }
                return subGraphs[name];
            }, getNode = function (name, force) {
                if (force === void 0) { force = true; }
                if (!nodes.hasOwnProperty(name) && force) {
                    nodes[name] = new sparql.Node(killPrefixes(name));
                    object.addNode(nodes[name]);
                }
                return nodes[name] || null;
            }, getEdges = function (name) {
                var edges = [];
                for (var _i = 0, _a = object.getEdgeList(); _i < _a.length; _i++) {
                    var edge = _a[_i];
                    if (edge.getName() === name) {
                        edges.push(edge);
                    }
                }
                return edges;
            };
            var killPrefixes = function (string) {
                if (string === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                    // this is a special predicate
                    return "a";
                }
                else if (string.indexOf('http://www.w3.org/2001/XMLSchema#boolean') !== -1) {
                    // booleans
                    return string.substr(1, string.indexOf('"', 1) - 1);
                }
                var prefixes = queryJson.prefixes;
                for (var prefix in prefixes) {
                    if (!prefixes.hasOwnProperty(prefix))
                        continue;
                    if (string.indexOf(prefixes[prefix]) === 0) {
                        return string.replace(prefixes[prefix], prefix + ':');
                    }
                }
                return string;
            };
            var addTriple = function (triples, type, graph, service, union) {
                if (type === void 0) { type = sparql.EdgeType.REGULAR; }
                if (graph === void 0) { graph = null; }
                if (service === void 0) { service = null; }
                if (union === void 0) { union = null; }
                for (var _i = 0, triples_1 = triples; _i < triples_1.length; _i++) {
                    var triple = triples_1[_i];
                    if (typeof triple.predicate === "object") {
                        if (triple.predicate.type === "path") {
                            triple.predicate = triple.predicate.items.join(triple.predicate.pathType) + '*';
                        }
                    }
                    var edge = new sparql.Edge(killPrefixes(triple.predicate), getNode(triple.subject), getNode(triple.object), type, graph, service);
                    if (union !== null) {
                        union.addEdge(edge);
                    }
                    object.addEdge(edge);
                }
            }, addEdge = function (pattern, type, service, union) {
                if (type === void 0) { type = sparql.EdgeType.REGULAR; }
                if (service === void 0) { service = null; }
                if (union === void 0) { union = null; }
                var graph = null;
                if (pattern.type === "graph") {
                    graph = getGraph(pattern.name);
                }
                // if pattern.type === "bgp", graph is just null…
                addTriple(pattern.triples, type, graph, service, union);
            }, addEdges = function (patterns, type, service) {
                if (type === void 0) { type = sparql.EdgeType.REGULAR; }
                if (service === void 0) { service = null; }
                for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
                    var pattern = patterns_1[_i];
                    addEdge(pattern, type, service);
                }
            }, addWhereClause = function (where, type, service, union) {
                if (type === void 0) { type = sparql.EdgeType.REGULAR; }
                if (service === void 0) { service = null; }
                if (union === void 0) { union = null; }
                for (var _i = 0, where_1 = where; _i < where_1.length; _i++) {
                    var updateWhereClause = where_1[_i];
                    switch (updateWhereClause.type) {
                        case "group":
                            addWhereClause(updateWhereClause.patterns, type, service, union);
                            break;
                        case "graph":
                            updateWhereClause['triples'] = updateWhereClause.patterns[0].triples;
                        case "bgp":
                            addEdge(updateWhereClause, type, service, union);
                            break;
                        case "minus":
                            addWhereClause(updateWhereClause.patterns, sparql.EdgeType.MINUS, service, union);
                            break;
                        case "optional":
                            addWhereClause(updateWhereClause.patterns, sparql.EdgeType.OPTIONAL, service, union);
                            break;
                        case "service":
                            var newService = new sparql.Service(updateWhereClause.name);
                            addWhereClause(updateWhereClause.patterns, type, newService, union);
                            object.addService(newService);
                            break;
                        case "union":
                            var newUnion = new sparql.Union("U" + (object.getUnionList().length + 1));
                            object.addUnion(newUnion);
                            addWhereClause(updateWhereClause.patterns, type, service, newUnion);
                            break;
                        case "bind":
                            var bind = new sparql.Bind(generator.toPattern(updateWhereClause));
                            bind.addNode(getNode(updateWhereClause.variable, false));
                            bind.addEdge(getEdges(updateWhereClause.variable));
                            if (typeof updateWhereClause.expression === "string") {
                                bind.addNode(getNode(updateWhereClause.expression, false));
                                bind.addEdge(getEdges(updateWhereClause.expression));
                            }
                            else {
                                for (var _a = 0, _b = updateWhereClause.expression.args; _a < _b.length; _a++) {
                                    var bindArg = _b[_a];
                                    bind.addNode(getNode(bindArg, false));
                                    bind.addEdge(getEdges(bindArg));
                                }
                            }
                            object.addBind(bind);
                            break;
                        case "filter":
                            var filter = new sparql.Filter(generator.toPattern(updateWhereClause));
                            for (var _c = 0, _d = updateWhereClause.expression.args; _c < _d.length; _c++) {
                                var filterArg = _d[_c];
                                if (typeof filterArg === "object") {
                                    if (filterArg.hasOwnProperty('args')) {
                                        for (var _e = 0, _f = filterArg.args; _e < _f.length; _e++) {
                                            var subFilterArg = _f[_e];
                                            filter.addNode(getNode(subFilterArg, false));
                                            filter.addEdge(getEdges(subFilterArg));
                                        }
                                    }
                                    else if (filterArg.hasOwnProperty('triples')) {
                                        for (var _g = 0, _h = filterArg.triples; _g < _h.length; _g++) {
                                            var filterTriple = _h[_g];
                                            var edges = getEdges(filterTriple.predicate);
                                            if (edges.length === 0) {
                                                addTriple([filterTriple], type, null, service, union);
                                            }
                                            filter.addNode(getNode(filterTriple.subject));
                                            filter.addNode(getNode(filterTriple.object));
                                            filter.addEdge(getEdges(filterTriple.predicate));
                                        }
                                    }
                                }
                                else {
                                    filter.addNode(getNode(filterArg, false));
                                    filter.addEdge(getEdges(filterArg));
                                }
                            }
                            object.addFilter(filter);
                    }
                }
            };
            var where;
            if (queryJson.type === "update") {
                // insert or delete
                addEdges(queryJson.updates[0].insert, sparql.EdgeType.INSERT);
                if (queryJson.updates[0].hasOwnProperty('delete')) {
                    addEdges(queryJson.updates[0].delete, sparql.EdgeType.DELETE);
                }
                where = queryJson.updates[0].where || [];
            }
            else if (queryJson.type === "query") {
                if (queryJson.queryType === 'CONSTRUCT') {
                    addTriple(queryJson.template, sparql.EdgeType.CONSTRUCT);
                }
                where = queryJson.where;
            }
            addWhereClause(where);
            if (queryJson.type === "query" && queryJson.queryType === "SELECT") {
                if (queryJson.variables.length === 1 && queryJson.variables[0] === "*") {
                    for (var _i = 0, _a = object.getNodeList(); _i < _a.length; _i++) {
                        var node = _a[_i];
                        node.setType(sparql.NodeType.SELECT);
                    }
                }
                for (var _b = 0, _c = queryJson.variables; _b < _c.length; _b++) {
                    var selectVariable = _c[_b];
                    if (nodes.hasOwnProperty(selectVariable)) {
                        nodes[selectVariable].setType(sparql.NodeType.SELECT);
                    }
                }
            }
            if (queryJson.hasOwnProperty('limit')) {
                object.setLimit(queryJson.limit);
            }
            if (queryJson.hasOwnProperty('order')) {
                var order = new sparql.Order();
                for (var _d = 0, _e = queryJson.order; _d < _e.length; _d++) {
                    var expression = _e[_d];
                    if (nodes.hasOwnProperty(expression.expression)) {
                        order.addNode(nodes[expression.expression]);
                    }
                }
                object.setOrder(order);
            }
            return object;
        };
        return {
            parse: function (newQuery) {
                if (newQuery !== undefined) {
                    try {
                        query = objectify(parser.parse(newQuery));
                    }
                    catch (e) {
                        alert(e);
                    }
                }
            },
            getObject: function () {
                return query;
            }
        };
    }]);
