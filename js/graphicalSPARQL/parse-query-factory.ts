/// <reference path="../jquery/jquery.d.ts" />
/// <reference path="../angular/angular.d.ts" />
/// <reference path="../d3/d3.d.ts" />
/// <reference path="d3-angular.d.ts" />
/// <reference path="../sparql-js/sparqljs.d.ts" />

angular.module("sparqlJs").factory('parseQueryService', [function()
{
    var parser = sparqljs.Parser();
    var query: sparql.Query = null;

    var objectify = function(queryJson: sparqlJs.sparqlJsJson): sparql.Query {
        var object = new sparql.Query();
        var generator = sparqljs.Generator();

        var nodes: sparql.Node[] = [], subGraphs: sparql.SubGraph[] = [];

        var getGraph = function(name: string): sparql.SubGraph
        {
            if(!subGraphs.hasOwnProperty(name))
            {
                subGraphs[name] = new sparql.SubGraph(name);

                object.addSubGraph(subGraphs[name]);
            }

            return subGraphs[name];
        }, getNode = function(name: string, force = true): sparql.Node
        {
            if(!nodes.hasOwnProperty(name) && force)
            {
                nodes[name] = new sparql.Node(killPrefixes(name));

                object.addNode(nodes[name]);
            }

            return nodes[name] || null;
        }, getEdges = function(name: string) {
            var edges = [];

            for(var edge of object.getEdgeList())
            {
                if(edge.getName() === name)
                {
                    edges.push(edge);
                }
            }

            return edges;
        };

        var killPrefixes = function(string: string)
        {
            if(string === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type")
            {
                // this is a special predicate
                return "a";
            }
            else if(string.indexOf('http://www.w3.org/2001/XMLSchema#boolean') !== -1)
            {
                // booleans
                return string.substr(1, string.indexOf('"', 1) - 1);
            }

            var prefixes = queryJson.prefixes;

            for(var prefix in prefixes)
            {
                if(!prefixes.hasOwnProperty(prefix)) continue;

                if(string.indexOf(prefixes[prefix]) === 0)
                {
                    return string.replace(prefixes[prefix], prefix + ':');
                }
            }

            return string;
        };

        var addTriple = function(triples: sparqlJs.sparqlTriple[], type: sparql.EdgeType = sparql.EdgeType.REGULAR, graph: sparql.SubGraph = null, service: sparql.Service = null, union: sparql.Union = null)
        {
            for(var triple of triples)
            {
                if(typeof triple.predicate === "object")
                {
                    if(triple.predicate.type === "path")
                    {
                        triple.predicate = triple.predicate.items.join(triple.predicate.pathType) + '*';
                    }
                }

                var edge = new sparql.Edge(
                    killPrefixes(triple.predicate),
                    getNode(triple.subject),
                    getNode(triple.object),
                    type,
                    graph,
                    service
                );

                if(union !== null)
                {
                    union.addEdge(edge);
                }

                object.addEdge(edge);
            }
        }, addEdge = function(pattern: sparqlJs.sparqlJsPattern, type: sparql.EdgeType = sparql.EdgeType.REGULAR, service: sparql.Service = null, union: sparql.Union = null)
        {
            var graph = null;

            if(pattern.type === "graph")
            {
                graph = getGraph(pattern.name);
            }
            // if pattern.type === "bgp", graph is just null…
            addTriple(pattern.triples, type, graph, service, union);
        }, addEdges = function(patterns: sparqlJs.sparqlJsPattern[], type: sparql.EdgeType = sparql.EdgeType.REGULAR, service: sparql.Service = null)
        {
            for(var pattern of patterns)
            {
                addEdge(pattern, type, service);
            }
        }, addWhereClause = function(where:sparqlJs.sparqlJsWhere[] | sparqlJs.sparqlJsPattern[], type: sparql.EdgeType = sparql.EdgeType.REGULAR, service: sparql.Service = null, union: sparql.Union = null)
        {
            for(var updateWhereClause of where)
            {
                switch(updateWhereClause.type)
                {
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

                        if(typeof updateWhereClause.expression === "string")
                        {
                            bind.addNode(getNode(updateWhereClause.expression, false));
                            bind.addEdge(getEdges(updateWhereClause.expression));
                        }
                        else
                        {
                            for(var bindArg of updateWhereClause.expression.args)
                            {
                                bind.addNode(getNode(bindArg, false));
                                bind.addEdge(getEdges(bindArg));
                            }
                        }

                        object.addBind(bind);
                        break;
                    case "filter":
                        var filter = new sparql.Filter(generator.toPattern(updateWhereClause));

                        for(var filterArg of updateWhereClause.expression.args)
                        {
                            if(typeof filterArg === "object")
                            {
                                if(filterArg.hasOwnProperty('args'))
                                {
                                    for(var subFilterArg of filterArg.args)
                                    {
                                        filter.addNode(getNode(subFilterArg, false));
                                        filter.addEdge(getEdges(subFilterArg));
                                    }
                                }
                                else if(filterArg.hasOwnProperty('triples'))
                                {
                                    for(var filterTriple of filterArg.triples)
                                    {
                                        var edges = getEdges(filterTriple.predicate);

                                        if(edges.length === 0)
                                        {
                                            addTriple([filterTriple], type, null, service, union);
                                        }

                                        filter.addNode(getNode(filterTriple.subject));
                                        filter.addNode(getNode(filterTriple.object));
                                        filter.addEdge(getEdges(filterTriple.predicate));
                                    }
                                }
                            }
                            else
                            {
                                filter.addNode(getNode(filterArg, false));
                                filter.addEdge(getEdges(filterArg));
                            }
                        }

                        object.addFilter(filter);
                }
            }
        };

        var where: sparqlJs.sparqlJsWhere[] | sparqlJs.sparqlJsPattern[];

        if(queryJson.type === "update")
        {
            // insert or delete
            addEdges(queryJson.updates[0].insert, sparql.EdgeType.INSERT);

            if(queryJson.updates[0].hasOwnProperty('delete'))
            {
                addEdges(queryJson.updates[0].delete, sparql.EdgeType.DELETE);
            }

            where = queryJson.updates[0].where || [];
        }
        else if(queryJson.type === "query")
        {
            if(queryJson.queryType === 'CONSTRUCT')
            {
                addTriple(queryJson.template, sparql.EdgeType.CONSTRUCT);
            }

            where = queryJson.where;
        }

        addWhereClause(where);

        if(queryJson.type === "query" && queryJson.queryType === "SELECT")
        {
            if(queryJson.variables.length === 1 && queryJson.variables[0] === "*")
            {
                for(var node of object.getNodeList())
                {
                    node.setType(sparql.NodeType.SELECT);
                }
            }

            for(var selectVariable of queryJson.variables)
            {
                if(nodes.hasOwnProperty(selectVariable))
                {
                    nodes[selectVariable].setType(sparql.NodeType.SELECT);
                }
            }
        }

        if(queryJson.hasOwnProperty('limit'))
        {
            object.setLimit(queryJson.limit);
        }

        if(queryJson.hasOwnProperty('order'))
        {
            var order = new sparql.Order();

            for(var expression of queryJson.order)
            {
                if(nodes.hasOwnProperty(expression.expression))
                {
                    order.addNode(nodes[expression.expression]);
                }
            }

            object.setOrder(order);
        }


        return object;
    };

    return {
        parse: function(newQuery: string) {
            if(newQuery !== undefined)
            {
                try {
                    query = objectify(parser.parse(newQuery));
                }
                catch(e)
                {
                    alert(e);
                }
            }
        },
        getObject: function(): sparql.Query {
            return query;
        }
    }

}]);