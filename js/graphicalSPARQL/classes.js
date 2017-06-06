var sparql;
(function (sparql) {
    var EdgeType;
    (function (EdgeType) {
        EdgeType[EdgeType["INSERT"] = 0] = "INSERT";
        EdgeType[EdgeType["DELETE"] = 1] = "DELETE";
        EdgeType[EdgeType["MINUS"] = 2] = "MINUS";
        EdgeType[EdgeType["OPTIONAL"] = 3] = "OPTIONAL";
        EdgeType[EdgeType["CONSTRUCT"] = 4] = "CONSTRUCT";
        EdgeType[EdgeType["REGULAR"] = 5] = "REGULAR";
    })(EdgeType = sparql.EdgeType || (sparql.EdgeType = {}));
    var NodeType;
    (function (NodeType) {
        NodeType[NodeType["SELECT"] = 0] = "SELECT";
        NodeType[NodeType["REGULAR"] = 1] = "REGULAR";
    })(NodeType = sparql.NodeType || (sparql.NodeType = {}));
    var GraphEdgeType;
    (function (GraphEdgeType) {
        GraphEdgeType[GraphEdgeType["LINEAR"] = 0] = "LINEAR";
        GraphEdgeType[GraphEdgeType["BEZIER_POSITIVE"] = 1] = "BEZIER_POSITIVE";
        GraphEdgeType[GraphEdgeType["BEZIER_NEGATIVE"] = -1] = "BEZIER_NEGATIVE";
    })(GraphEdgeType = sparql.GraphEdgeType || (sparql.GraphEdgeType = {}));
    /**
     * Distance of the first and second curve from the first one
     * @type {number}
     */
    var BEZIER_DISTANCE = 100;
    /**
     * Maximum number of steps for newton's method when calculating the intersection-point of the curve and the ellipse
     * @type {number}
     */
    var MAXIMUM_STEPS = 5;
    var Query = (function () {
        function Query() {
            this.edgeList = [];
            this.nodeList = [];
            this.subGraphList = [];
            this.serviceList = [];
            this.unionList = [];
            this.filterList = [];
            this.bindList = [];
            this.order = null;
            this.limit = Infinity;
        }
        Query.prototype.getEdgeList = function () { return this.edgeList; };
        Query.prototype.addEdge = function (edge) { this.edgeList.push(edge); return this; };
        Query.prototype.getNodeList = function () { return this.nodeList; };
        Query.prototype.addNode = function (node) { this.nodeList.push(node); return this; };
        Query.prototype.getSubGraphList = function () { return this.subGraphList; };
        Query.prototype.addSubGraph = function (subGraph) { this.subGraphList.push(subGraph); return this; };
        Query.prototype.getServiceList = function () { return this.serviceList; };
        Query.prototype.addService = function (service) { this.serviceList.push(service); return this; };
        Query.prototype.getUnionList = function () { return this.unionList; };
        Query.prototype.addUnion = function (union) { this.unionList.push(union); return this; };
        Query.prototype.getFilterList = function () { return this.filterList; };
        Query.prototype.addFilter = function (filter) { this.filterList.push(filter); return this; };
        Query.prototype.getBindList = function () { return this.bindList; };
        Query.prototype.addBind = function (bind) { this.bindList.push(bind); return this; };
        Query.prototype.getOrder = function () { return this.order; };
        Query.prototype.setOrder = function (order) { this.order = order; return this; };
        Query.prototype.getLimit = function () { return this.limit; };
        Query.prototype.setLimit = function (limit) { this.limit = limit; return this; };
        return Query;
    }());
    sparql.Query = Query;
    var Edge = (function () {
        /**
         * Set up a new Edge
         * This edge is automatically added to the start- und end-node's edge-list
         * @param name          the nodes name
         * @param startNode     the start node
         * @param endNode       the end node
         * @param type          the edge's type
         * @param subGraph      the sub-graph that this edge belongs to
         * @param service       the service that this edge belongs to
         */
        function Edge(name, startNode, endNode, type, subGraph, service) {
            if (type === void 0) { type = EdgeType.REGULAR; }
            if (subGraph === void 0) { subGraph = null; }
            if (service === void 0) { service = null; }
            /**
             * A list of all filters this edge belongs to
             * @type {Array}
             */
            this.filterList = [];
            /**
             * A list of all binds this edge belongs to
             * @type {Array}
             */
            this.bindList = [];
            /**
             * A list of all union-operations this edge belongs to
             * @type {Array}
             */
            this.unionList = [];
            /**
             * A list of all order-by-statements this edge belongs to
             * @type {Array}
             */
            this.orderList = [];
            /**
             * The edge-type
             */
            this.edgeType = GraphEdgeType.LINEAR;
            /**
             * The center Point for the Bezier-curve
             * @type {number[]}
             */
            this.centerPoint = [0, 0];
            /**
             * The interjection-point of the edge and the ellipse of the end-node
             * The third and fourth value represents the derivative of the curve in this point
             * @type {number[]}
             */
            this.interjectionPoint = [0, 0, 0, 0];
            this.name = name;
            this.startNode = startNode;
            this.endNode = endNode;
            this.type = type;
            this.subGraph = subGraph;
            this.service = service;
            startNode.addEdge(this);
            endNode.addEdge(this);
            if (subGraph !== null) {
                subGraph.addEdge(this);
                startNode.addSubGraph(subGraph);
                endNode.addSubGraph(subGraph);
            }
            if (service !== null) {
                service.addEdge(this);
                startNode.addService(service);
                endNode.addService(service);
            }
        }
        /**
         * Get this edge's name
         * @returns {string}
         */
        Edge.prototype.getName = function () {
            return this.name;
        };
        /**
         * get this edge's start-node
         * @returns {Node}
         */
        Edge.prototype.getStartNode = function () {
            return this.startNode;
        };
        /**
         * get this edges's end-node
         * @returns {Node}
         */
        Edge.prototype.getEndNode = function () {
            return this.endNode;
        };
        /**
         * get this edge's edge-type
         * @returns {EdgeType}
         */
        Edge.prototype.getType = function () {
            return this.type;
        };
        /**
         * get this edges's subgraph
         * @returns {SubGraph}
         */
        Edge.prototype.getSubgraph = function () {
            return this.subGraph;
        };
        /**
         * Get all filters that this edge belongs to
         * @returns {Filter[]}
         */
        Edge.prototype.getFilterList = function () {
            return this.filterList;
        };
        /**
         * Add a filter that this edge belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param filter
         * @returns {Edge}
         */
        Edge.prototype.addFilter = function (filter) {
            this.filterList.push(filter);
            return this;
        };
        /**
         * Get all binds that this edge belongs to
         * @returns {Filter[]}
         */
        Edge.prototype.getBindList = function () {
            return this.bindList;
        };
        /**
         * Add a bind that this edge belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param bind
         * @returns {Edge}
         */
        Edge.prototype.addBind = function (bind) {
            this.bindList.push(bind);
            return this;
        };
        /**
         * Get all union-operations that this edge belongs to
         * @returns {Union[]}
         */
        Edge.prototype.getUnionList = function () {
            return this.unionList;
        };
        /**
         * Add an union-operation that this edge belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param union
         * @returns {Edge}
         */
        Edge.prototype.addUnion = function (union) {
            this.unionList.push(union);
            this.startNode.addUnion(union);
            this.endNode.addUnion(union);
            return this;
        };
        /**
         * Get all order-by-statements that this edge belongs to
         * @returns {Order[]}
         */
        Edge.prototype.getOrderList = function () {
            return this.orderList;
        };
        /**
         * Add a order-by-statements that this edge belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param order
         * @returns {Edge}
         */
        Edge.prototype.addOrder = function (order) {
            this.orderList.push(order);
            return this;
        };
        /**
         * Get the service that this edge belongs to
         * @returns {Service}
         */
        Edge.prototype.getService = function () {
            return this.service;
        };
        Edge.prototype.isInsert = function () {
            return this.getType() === EdgeType.INSERT;
        };
        Edge.prototype.isDelete = function () {
            return this.getType() === EdgeType.DELETE;
        };
        Edge.prototype.isMinus = function () {
            return this.getType() === EdgeType.MINUS;
        };
        Edge.prototype.isOptional = function () {
            return this.getType() === EdgeType.OPTIONAL;
        };
        Edge.prototype.isConstruct = function () {
            return this.getType() === EdgeType.CONSTRUCT;
        };
        Edge.prototype.setType = function (type) {
            this.edgeType = type;
            return this;
        };
        /**
         * get the center point
         * returns [x, y]
         * @returns {number[]}
         */
        Edge.prototype.getCenterPoint = function () {
            return this.centerPoint;
        };
        Edge.prototype.updateCenterPoint = function () {
            var x = this.startNode.getX(), y = this.startNode.getY();
            var dx = this.endNode.getX() - x, dy = this.endNode.getY() - y;
            var distanceFromCenter = this.edgeType * BEZIER_DISTANCE;
            var distanceBetweenStartAndEnd = Math.sqrt(dx * dx + dy * dy);
            x += dx / 2 + distanceFromCenter * dy / distanceBetweenStartAndEnd;
            y += dy / 2 - distanceFromCenter * dx / distanceBetweenStartAndEnd;
            this.centerPoint = [x, y];
        };
        /**
         * Update the interjection-point of the bezier-curve associated with this edge and the ellipse associated with
         * the end-node - this is the point the arrow points to
         * The derivative dy/dy in this point is also provided, so we know how the direction the arrow should be
         * pointing to
         */
        Edge.prototype.updateInterjectionPoint = function () {
            // The center point of the quadratic bezier-curve
            var _a = this.getCenterPoint(), x1 = _a[0], y1 = _a[1];
            // for this calculation we assume, that the end-node is at the center of our coordinate-system
            x1 -= this.endNode.getX();
            y1 -= this.endNode.getY();
            // The end point of the quadratic bezier-curve
            var x2 = this.startNode.getX() - this.endNode.getX(), y2 = this.startNode.getY() - this.endNode.getY();
            // get the ellipse-parameters of the end-point
            var a = this.endNode.getEllipseParameterX(), b = this.endNode.getEllipseParameterY();
            // we will need these calculations more often, so we store the result
            var aSquared = a * a, bSquared = b * b, x2Minus2x1 = x2 - 2 * x1, y2Minus2y1 = y2 - 2 * y1;
            // initial value is solution for distanceFromCenter = 0 (see function getCenterPoint)
            // this equals this.type == GraphEdgeType.LINEAR
            var t_n = a * b / Math.sqrt(x2 * x2 * bSquared + y2 * y2 * aSquared);
            // for a given bezier-curve we can calculate the curve as a function of t
            var x_t = function (t) {
                return t * (2 * x1 + x2Minus2x1 * t);
            }, y_t = function (t) {
                return t * (2 * y1 + y2Minus2y1 * t);
            };
            // for a non-linear curve, the parameter t will be slightly different
            // so we use newton's method to calculate it numerically
            if (this.edgeType !== GraphEdgeType.LINEAR) {
                // this is the function we want calculate the zero-crossing point for
                // this is basically just the ellipse-equation with x_t and y_t substituted (see the functions x_t and y_t)
                var f = function (t) {
                    // ((x2 - 2 x1)^2 b^2 + (y2 - 2 y1)^2 a^2) t^4 + 4 (x1 (x2 - 2 x1) b^2 + y1 (y2 - 2 y1) a^2) t^3 + 4 (x1^2 b^2 + y1^2 a^2) t^2 - a^2 b^2
                    return (x2Minus2x1 * x2Minus2x1 * bSquared + y2Minus2y1 * y2Minus2y1 * aSquared) * t * t * t * t +
                        4 * (x1 * x2Minus2x1 * bSquared + y1 * y2Minus2y1 * aSquared) * t * t * t +
                        4 * (x1 * x1 * bSquared + y1 * y1 * aSquared) * t * t - aSquared * bSquared;
                }, 
                // for newton's method we also need the derivative of the function f, here it is
                df_dt = function (t) {
                    // 4 * ((x2 - 2 x1)^2 b^2 + (y2 - 2 y1)^2 a^2) t^3 + 12 (x1 (x2 - 2 x1) b^2 + y1 (y2 - 2 y1) a^2) t^2 + 8 (x1^2 b^2 + y1^2 a^2) t
                    return 4 * (x2Minus2x1 * x2Minus2x1 * bSquared + y2Minus2y1 * y2Minus2y1 * aSquared) * t * t * t +
                        12 * (x1 * x2Minus2x1 * bSquared + y1 * y2Minus2y1 * aSquared) * t * t +
                        8 * (x1 * x1 * bSquared + y1 * y1 * aSquared) * t;
                };
                // we need an upper bound for the change in t so the newton's method terminates
                // the length of the bezier-curve is smaller or equal than the length of the lines connecting the
                // curve's points. So every pixel has a maximum t-range of 1/(length between points).
                // Since we don't care if the result is one or two pixels off (and the bezier curve is usually shorter
                // than this distance), we take the double of this.
                var bound = 2 / (Math.abs(x1 * x2 + y1 * y1) + Math.abs(x2 * x2 + y2 * y2)), t_n1;
                // calculate newton's method
                // we do not want this to be an infinite loop, so we set a maximum number of iterations
                for (var n = 0; n < MAXIMUM_STEPS; n++) {
                    t_n1 = t_n;
                    t_n = t_n1 - f(t_n1) / df_dt(t_n1);
                    if (Math.abs(t_n1 - t_n) < bound) {
                        break;
                    }
                }
            }
            // derivative of the curve in the resulting point
            // straight-forward derivation of the functions x_t and y_t
            var derivative = [x2Minus2x1 * t_n + x1, y2Minus2y1 * t_n + y1];
            var x_i = this.endNode.getX() + x_t(t_n), y_i = this.endNode.getY() + y_t(t_n);
            // the final result
            this.interjectionPoint = [x_i, y_i, derivative[0], derivative[1]];
        };
        /**
         * Get the interjection-point of the bezier-curve associated with this edge and the ellipse associated with
         * the end-node - this is the point the arrow points to
         * @returns {*[]}
         */
        Edge.prototype.getInterjectionPoint = function () {
            return [this.interjectionPoint[0], this.interjectionPoint[1]];
        };
        /**
         * Get the interjection-angle of the bezier-curve associated with this edge and the ellipse associated with
         * the end-node
         * @returns {number}
         */
        Edge.prototype.getInterjectionAngle = function () {
            return 180 * Math.atan2(this.interjectionPoint[3], this.interjectionPoint[2]) / Math.PI;
        };
        return Edge;
    }());
    sparql.Edge = Edge;
    var Node = (function () {
        /**
         * Set up a new node
         * @param name
         * @param type
         */
        function Node(name, type) {
            if (type === void 0) { type = NodeType.REGULAR; }
            /**
             * A list of all sub-graphs this node belongs to
             */
            this.subGraphList = [];
            /**
             * A list of all edges that are connected to this node
             * @type {Array}
             */
            this.edgeList = [];
            /**
             * A list of all filters this node belongs to
             * @type {Array}
             */
            this.filterList = [];
            /**
             * A list of all binds this node belongs to
             * @type {Array}
             */
            this.bindList = [];
            /**
             * A list of all unions this node belongs to
             * @type {Array}
             */
            this.unionList = [];
            /**
             * A list of all order-by-statements this node belongs to
             * @type {Array}
             */
            this.orderList = [];
            /**
             * A list of all services this node belongs to
             * @type {Array}
             */
            this.serviceList = [];
            this.fixed = false;
            this.name = name;
            this.type = type;
        }
        /**
         * Get the node's name
         * @returns {string}
         */
        Node.prototype.getName = function () {
            return this.name;
        };
        /**
         * Get the node's type
         * @returns {NodeType}
         */
        Node.prototype.getType = function () {
            return this.type;
        };
        /**
         * Set the node's type
         * @param type
         * @returns {sparql.Node}
         */
        Node.prototype.setType = function (type) {
            this.type = type;
            return this;
        };
        Node.prototype.isSelect = function () {
            return this.type === NodeType.SELECT;
        };
        /**
         * Get all sub-graphs this node belongs to
         * @returns {SubGraph[]}
         */
        Node.prototype.getSubGraphList = function () {
            return this.subGraphList;
        };
        /**
         * Add a sub-graph this node belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param subGraph
         * @returns {sparql.Node}
         */
        Node.prototype.addSubGraph = function (subGraph) {
            this.subGraphList.push(subGraph);
            subGraph.addNode(this);
            return this;
        };
        /**
         * Get all edges that are connected to this node
         * @returns {Edge[]}
         */
        Node.prototype.getEdgeList = function () {
            return this.edgeList;
        };
        /**
         * Add an edge that is connected to this node
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param edge
         * @returns {sparql.Node}
         */
        Node.prototype.addEdge = function (edge) {
            this.edgeList.push(edge);
            return this;
        };
        /**
         * Get all filters this node belongs to
         * @returns {Filter[]}
         */
        Node.prototype.getFilterList = function () {
            return this.filterList;
        };
        /**
         * Add a filter that this node belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param filter
         * @returns {sparql.Node}
         */
        Node.prototype.addFilter = function (filter) {
            this.filterList.push(filter);
            return this;
        };
        /**
         * Get all binds this node belongs to
         * @returns {Bind[]}
         */
        Node.prototype.getBindList = function () {
            return this.bindList;
        };
        /**
         * Add a filter that this node belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param bind
         * @returns {sparql.Node}
         */
        Node.prototype.addBind = function (bind) {
            this.bindList.push(bind);
            return this;
        };
        /**
         * Get all unions this node belongs to
         * @returns {Union[]}
         */
        Node.prototype.getUnionList = function () {
            return this.unionList;
        };
        /**
         * Add a union that this node belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param union
         * @returns {sparql.Node}
         */
        Node.prototype.addUnion = function (union) {
            for (var u in this.unionList) {
                if (u === union) {
                    return this;
                }
            }
            this.unionList.push(union);
            return this;
        };
        /**
         * Get all unions this node belongs to
         * @returns {Order[]}
         */
        Node.prototype.getOrderList = function () {
            return this.orderList;
        };
        /**
         * Add a order-by-statement that this node belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param order
         * @returns {sparql.Node}
         */
        Node.prototype.addOrder = function (order) {
            this.orderList.push(order);
            return this;
        };
        /**
         * Get all services this node belongs to
         * @returns {Service[]}
         */
        Node.prototype.getServiceList = function () {
            return this.serviceList;
        };
        /**
         * Add a service that this node belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param service
         * @returns {sparql.Node}
         */
        Node.prototype.addService = function (service) {
            this.serviceList.push(service);
            service.addNode(this);
            return this;
        };
        /**
         * Get x-position
         * @returns {number}
         */
        Node.prototype.getX = function () {
            return this.x;
        };
        /**
         * Get y-position
         * @returns {number}
         */
        Node.prototype.getY = function () {
            return this.y;
        };
        /**
         * Get the ellipse-parameter a with x^2 / a^2 + y^2 / b^2 = 1
         * @returns {number}
         */
        Node.prototype.getEllipseParameterX = function () {
            return this.rx * 0.6;
        };
        /**
         * Get the ellipse-parameter b with x^2 / a^2 + y^2 / b^2 = 1
         * @returns {number}
         */
        Node.prototype.getEllipseParameterY = function () {
            return this.ry * 0.9;
        };
        return Node;
    }());
    sparql.Node = Node;
    var SubGraph = (function () {
        /**
         * Set up a new sub-graph
         * @param name
         */
        function SubGraph(name) {
            /**
             * A list of all nodes that are inside this sub-graph
             * @type {Array}
             */
            this.nodeList = [];
            /**
             * A list of all edges that are inside this sub-graph
             * @type {Array}
             */
            this.edgeList = [];
            this.name = name;
        }
        /**
         * Get the sub-graph's name
         * @returns {string}
         */
        SubGraph.prototype.getName = function () {
            return this.name;
        };
        /**
         * Get all nodes that are inside this sub-graph
         * @returns {Node[]}
         */
        SubGraph.prototype.getNodeList = function () {
            return this.nodeList;
        };
        /**
         * Add a node to this sub-graph
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param node
         * @returns {SubGraph}
         */
        SubGraph.prototype.addNode = function (node) {
            for (var _i = 0, _a = this.nodeList; _i < _a.length; _i++) {
                var containingNode = _a[_i];
                if (containingNode === node) {
                    return this;
                }
            }
            this.nodeList.push(node);
            return this;
        };
        /**
         * Get all edges that are inside this sub-graph
         * @returns {Edge[]}
         */
        SubGraph.prototype.getEdgeList = function () {
            return this.edgeList;
        };
        /**
         * Add an edge to this sub-graph
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param edge
         * @returns {SubGraph}
         */
        SubGraph.prototype.addEdge = function (edge) {
            for (var _i = 0, _a = this.edgeList; _i < _a.length; _i++) {
                var containingEdge = _a[_i];
                if (containingEdge === edge) {
                    return this;
                }
            }
            this.edgeList.push(edge);
            return this;
        };
        return SubGraph;
    }());
    sparql.SubGraph = SubGraph;
    var Service = (function () {
        /**
         * Set up a new service
         * @param name
         */
        function Service(name) {
            /**
             * A list of all nodes that are inside this service
             * @type {Array}
             */
            this.nodeList = [];
            /**
             * A list of all edges that are inside this service
             * @type {Array}
             */
            this.edgeList = [];
            this.name = name;
        }
        /**
         * Get the service's name
         * @returns {string}
         */
        Service.prototype.getName = function () {
            return this.name;
        };
        /**
         * Get all nodes that are inside this service
         * @returns {Node[]}
         */
        Service.prototype.getNodeList = function () {
            return this.nodeList;
        };
        /**
         * Add a node to this service
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param node
         * @returns {SubGraph}
         */
        Service.prototype.addNode = function (node) {
            for (var _i = 0, _a = this.nodeList; _i < _a.length; _i++) {
                var containingNode = _a[_i];
                if (containingNode === node) {
                    return this;
                }
            }
            this.nodeList.push(node);
            return this;
        };
        /**
         * Get all edges that are inside this service
         * @returns {Edge[]}
         */
        Service.prototype.getEdgeList = function () {
            return this.edgeList;
        };
        /**
         * Add an edge to this service
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param edge
         * @returns {SubGraph}
         */
        Service.prototype.addEdge = function (edge) {
            for (var _i = 0, _a = this.edgeList; _i < _a.length; _i++) {
                var containingEdge = _a[_i];
                if (containingEdge === edge) {
                    return this;
                }
            }
            this.edgeList.push(edge);
            return this;
        };
        return Service;
    }());
    sparql.Service = Service;
    var Union = (function () {
        /**
         * Set up a new union
         * @param name
         */
        function Union(name) {
            /**
             * A list of all edges that belong to this union
             * @type {Array}
             */
            this.edgeList = [];
            this.name = name;
        }
        /**
         * Get the union's name
         * @returns {string}
         */
        Union.prototype.getName = function () {
            return this.name;
        };
        /**
         * Get all edges that belong to this union
         * @returns {Edge[]}
         */
        Union.prototype.getEdgeList = function () {
            return this.edgeList;
        };
        /**
         * Add a new edge to this union
         * @param edge
         * @returns {Union}
         */
        Union.prototype.addEdge = function (edge) {
            this.edgeList.push(edge);
            edge.addUnion(this);
            return this;
        };
        return Union;
    }());
    sparql.Union = Union;
    var Filter = (function () {
        /**
         * Set up a new filter
         * @param text
         */
        function Filter(text) {
            /**
             * A list of all edges that belong to this filter
             * @type {Array}
             */
            this.edgeList = [];
            /**
             * A list of all nodes that belong to this filter
             * @type {Array}
             */
            this.nodeList = [];
            this.text = text;
        }
        /**
         * Get the textual representation of this filter
         * @returns {string}
         */
        Filter.prototype.getText = function () {
            return this.text;
        };
        /**
         * Get all edges that belong to this filter
         * @returns {Edge[]}
         */
        Filter.prototype.getEdgeList = function () {
            return this.edgeList;
        };
        /**
         * Add a new edge to this filter
         * @param edges
         * @returns {Filter}
         */
        Filter.prototype.addEdge = function (edges) {
            for (var _i = 0, edges_1 = edges; _i < edges_1.length; _i++) {
                var edge = edges_1[_i];
                this.edgeList.push(edge);
                edge.addFilter(this);
            }
            return this;
        };
        /**
         * Get all nodes that belong to this filter
         * @returns {Node[]}
         */
        Filter.prototype.getNodeList = function () {
            return this.nodeList;
        };
        /**
         * Add a new node to this filter
         * @param node
         * @returns {Filter}
         */
        Filter.prototype.addNode = function (node) {
            if (node !== null) {
                this.nodeList.push(node);
                node.addFilter(this);
            }
            return this;
        };
        return Filter;
    }());
    sparql.Filter = Filter;
    var Bind = (function () {
        /**
         * Set up a new bind
         * @param text
         */
        function Bind(text) {
            /**
             * A list of all edges that belong to this bind
             * @type {Array}
             */
            this.edgeList = [];
            /**
             * A list of all nodes that belong to this bind
             * @type {Array}
             */
            this.nodeList = [];
            this.text = text;
        }
        /**
         * Get the textual representation of this bind
         * @returns {string}
         */
        Bind.prototype.getText = function () {
            return this.text;
        };
        /**
         * Get all edges that belong to this bind
         * @returns {Edge[]}
         */
        Bind.prototype.getEdgeList = function () {
            return this.edgeList;
        };
        /**
         * Add a new edge to this bind
         * @param edges
         * @returns {Filter}
         */
        Bind.prototype.addEdge = function (edges) {
            for (var _i = 0, edges_2 = edges; _i < edges_2.length; _i++) {
                var edge = edges_2[_i];
                this.edgeList.push(edge);
                edge.addBind(this);
            }
            return this;
        };
        /**
         * Get all nodes that belong to this bind
         * @returns {Node[]}
         */
        Bind.prototype.getNodeList = function () {
            return this.nodeList;
        };
        /**
         * Add a new node to this bind
         * @param node
         * @returns {Filter}
         */
        Bind.prototype.addNode = function (node) {
            if (node !== null) {
                this.nodeList.push(node);
                node.addBind(this);
            }
            return this;
        };
        return Bind;
    }());
    sparql.Bind = Bind;
    var Order = (function () {
        function Order() {
            /**
             * A list of all edges that belong to this order
             * @type {Array}
             */
            this.edgeList = [];
            /**
             * A list of all nodes that belong to this order
             * @type {Array}
             */
            this.nodeList = [];
        }
        Order.prototype.getText = function () {
            var text = [];
            for (var _i = 0, _a = this.edgeList; _i < _a.length; _i++) {
                var edge = _a[_i];
                text.push(edge.getName());
            }
            for (var _b = 0, _c = this.nodeList; _b < _c.length; _b++) {
                var node = _c[_b];
                text.push(node.getName());
            }
            return text.join(', ');
        };
        /**
         * Get all edges that belong to this order
         * @returns {Edge[]}
         */
        Order.prototype.getEdgeList = function () {
            return this.edgeList;
        };
        /**
         * Add a new edge to this order
         * @param edge
         * @returns {Filter}
         */
        Order.prototype.addEdge = function (edge) {
            this.edgeList.push(edge);
            edge.addOrder(this);
            return this;
        };
        /**
         * Get all nodes that belong to this order
         * @returns {Node[]}
         */
        Order.prototype.getNodeList = function () {
            return this.nodeList;
        };
        /**
         * Add a new node to this order
         * @param node
         * @returns {Filter}
         */
        Order.prototype.addNode = function (node) {
            this.nodeList.push(node);
            node.addOrder(this);
            return this;
        };
        return Order;
    }());
    sparql.Order = Order;
})(sparql || (sparql = {}));
