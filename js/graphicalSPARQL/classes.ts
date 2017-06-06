module sparql {

    export enum EdgeType {
        INSERT,
        DELETE,
        MINUS,
        OPTIONAL,
        CONSTRUCT,
        REGULAR
    }

    export enum NodeType {
        SELECT,
        REGULAR
    }

    export enum GraphEdgeType {
        LINEAR = 0,
        BEZIER_POSITIVE = 1,
        BEZIER_NEGATIVE = -1
    }

    /**
     * Distance of the first and second curve from the first one
     * @type {number}
     */
    const BEZIER_DISTANCE = 100;
    /**
     * Maximum number of steps for newton's method when calculating the intersection-point of the curve and the ellipse
     * @type {number}
     */
    const MAXIMUM_STEPS = 5;

    export class Query {
        private edgeList: Edge[] = [];
        private nodeList: Node[] = [];
        private subGraphList: SubGraph[] = [];
        private serviceList: Service[] = [];
        private unionList: Union[] = [];
        private filterList: Filter[] = [];
        private bindList: Bind[] = [];
        private order: Order = null;
        private limit: number = Infinity;

        getEdgeList(): Edge[] {return this.edgeList;}
        addEdge(edge: Edge): this {this.edgeList.push(edge); return this;}

        getNodeList(): Node[] {return this.nodeList;}
        addNode(node: Node): this {this.nodeList.push(node); return this;}

        getSubGraphList(): SubGraph[] {return this.subGraphList;}
        addSubGraph(subGraph: SubGraph): this {this.subGraphList.push(subGraph); return this;}

        getServiceList(): Service[] {return this.serviceList;}
        addService(service: Service): this {this.serviceList.push(service); return this;}

        getUnionList(): Union[] {return this.unionList;}
        addUnion(union: Union): this {this.unionList.push(union); return this;}

        getFilterList(): Filter[] {return this.filterList;}
        addFilter(filter: Filter): this {this.filterList.push(filter); return this;}

        getBindList(): Bind[] {return this.bindList;}
        addBind(bind: Bind): this {this.bindList.push(bind); return this;}

        getOrder(): Order {return this.order;}
        setOrder(order: Order): this {this.order = order; return this;}

        getLimit(): number {return this.limit;}
        setLimit(limit: number): this {this.limit = limit; return this;}
    }

    export class Edge {
        /**
         * The edge's name
         */
        private name: string;
        /**
         * The node the edge starts at
         */
        private startNode: Node;
        /**
         * The node the edge ends at
         */
        private endNode: Node;
        /**
         * The edge's type
         * Tells whether the edge represents a insert-, delete-, minus- or a normal operation
         */
        private type: EdgeType;
        /**
         * The sub-graph the edge belongs to
         * Note that this can be null!
         */
        private subGraph: SubGraph;
        /**
         * A list of all filters this edge belongs to
         * @type {Array}
         */
        private filterList: Filter[] = [];
        /**
         * A list of all binds this edge belongs to
         * @type {Array}
         */
        private bindList: Bind[] = [];
        /**
         * A list of all union-operations this edge belongs to
         * @type {Array}
         */
        private unionList: Union[] = [];
        /**
         * A list of all order-by-statements this edge belongs to
         * @type {Array}
         */
        private orderList: Order[] = [];
        /**
         * A list of all services this edge belongs to
         * @type {Array}
         */
        private service: Service;
        /**
         * The edge-type
         */
        private edgeType: GraphEdgeType = GraphEdgeType.LINEAR;
        /**
         * The center Point for the Bezier-curve
         * @type {number[]}
         */
        private centerPoint: [number, number] = [0, 0];
        /**
         * The interjection-point of the edge and the ellipse of the end-node
         * The third and fourth value represents the derivative of the curve in this point
         * @type {number[]}
         */
        private interjectionPoint: [number, number, number, number] = [0, 0, 0, 0];
        /**
         * size of the edge
         */
        size: number;
        /**
         * the source-id in the node-list
         * this is used by d3
         */
        source: number;
        /**
         * the target-id in the node-list
         * this is used by d3
         */
        target: number;

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
        constructor(name: string, startNode: Node, endNode: Node, type: EdgeType = EdgeType.REGULAR, subGraph: SubGraph = null, service: Service = null) {
            this.name = name;
            this.startNode = startNode;
            this.endNode = endNode;
            this.type = type;
            this.subGraph = subGraph;
            this.service = service;

            startNode.addEdge(this);
            endNode.addEdge(this);

            if(subGraph !== null)
            {
                subGraph.addEdge(this);
                startNode.addSubGraph(subGraph);
                endNode.addSubGraph(subGraph);
            }

            if(service !== null)
            {
                service.addEdge(this);
                startNode.addService(service);
                endNode.addService(service);
            }
        }

        /**
         * Get this edge's name
         * @returns {string}
         */
        getName(): string {
            return this.name;
        }

        /**
         * get this edge's start-node
         * @returns {Node}
         */
        getStartNode(): Node {
            return this.startNode;
        }

        /**
         * get this edges's end-node
         * @returns {Node}
         */
        getEndNode(): Node {
            return this.endNode;
        }

        /**
         * get this edge's edge-type
         * @returns {EdgeType}
         */
        getType(): EdgeType {
            return this.type;
        }

        /**
         * get this edges's subgraph
         * @returns {SubGraph}
         */
        getSubgraph(): SubGraph {
            return this.subGraph;
        }

        /**
         * Get all filters that this edge belongs to
         * @returns {Filter[]}
         */
        getFilterList(): Filter[] {
            return this.filterList;
        }

        /**
         * Add a filter that this edge belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param filter
         * @returns {Edge}
         */
        addFilter(filter: Filter): this {
            this.filterList.push(filter);

            return this;
        }

        /**
         * Get all binds that this edge belongs to
         * @returns {Filter[]}
         */
        getBindList(): Bind[] {
            return this.bindList;
        }

        /**
         * Add a bind that this edge belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param bind
         * @returns {Edge}
         */
        addBind(bind: Bind): this {
            this.bindList.push(bind);

            return this;
        }

        /**
         * Get all union-operations that this edge belongs to
         * @returns {Union[]}
         */
        getUnionList(): Union[] {
            return this.unionList;
        }

        /**
         * Add an union-operation that this edge belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param union
         * @returns {Edge}
         */
        addUnion(union: Union): this {
            this.unionList.push(union);

            this.startNode.addUnion(union);
            this.endNode.addUnion(union);

            return this;
        }

        /**
         * Get all order-by-statements that this edge belongs to
         * @returns {Order[]}
         */
        getOrderList(): Order[] {
            return this.orderList;
        }

        /**
         * Add a order-by-statements that this edge belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param order
         * @returns {Edge}
         */
        addOrder(order: Order): this {
            this.orderList.push(order);

            return this;
        }

        /**
         * Get the service that this edge belongs to
         * @returns {Service}
         */
        getService(): Service {
            return this.service;
        }

        isInsert(): boolean {
            return this.getType() === EdgeType.INSERT;
        }

        isDelete(): boolean {
            return this.getType() === EdgeType.DELETE;
        }

        isMinus(): boolean {
            return this.getType() === EdgeType.MINUS;
        }

        isOptional(): boolean {
            return this.getType() === EdgeType.OPTIONAL;
        }

        isConstruct(): boolean {
            return this.getType() === EdgeType.CONSTRUCT;
        }

        setType(type: GraphEdgeType) {
            this.edgeType = type;

            return this;
        }

        /**
         * get the center point
         * returns [x, y]
         * @returns {number[]}
         */
        getCenterPoint(): [number, number] {
            return this.centerPoint;
        }

        updateCenterPoint(): void {
            let x = this.startNode.getX(), y = this.startNode.getY();
            const dx = this.endNode.getX() - x, dy = this.endNode.getY() - y;

            const distanceFromCenter = this.edgeType * BEZIER_DISTANCE;

            const distanceBetweenStartAndEnd = Math.sqrt(dx * dx + dy * dy);

            x += dx / 2 + distanceFromCenter * dy / distanceBetweenStartAndEnd;
            y += dy / 2 - distanceFromCenter * dx / distanceBetweenStartAndEnd;

            this.centerPoint = [x, y];
        }

        /**
         * Update the interjection-point of the bezier-curve associated with this edge and the ellipse associated with
         * the end-node - this is the point the arrow points to
         * The derivative dy/dy in this point is also provided, so we know how the direction the arrow should be
         * pointing to
         */
        updateInterjectionPoint(): void {
            // The center point of the quadratic bezier-curve
            var [x1, y1] = this.getCenterPoint();
            // for this calculation we assume, that the end-node is at the center of our coordinate-system
            x1 -= this.endNode.getX();
            y1 -= this.endNode.getY();

            // The end point of the quadratic bezier-curve
            const x2 = this.startNode.getX() - this.endNode.getX(),
                y2 = this.startNode.getY() - this.endNode.getY();

            // get the ellipse-parameters of the end-point
            const a = this.endNode.getEllipseParameterX(),
                b = this.endNode.getEllipseParameterY();

            // we will need these calculations more often, so we store the result
            const aSquared = a * a,
                bSquared = b * b,
                x2Minus2x1 = x2 - 2 * x1,
                y2Minus2y1 = y2 - 2 * y1;

            // initial value is solution for distanceFromCenter = 0 (see function getCenterPoint)
            // this equals this.type == GraphEdgeType.LINEAR
            let t_n = a * b / Math.sqrt(x2 * x2 * bSquared + y2 * y2 * aSquared);

            // for a given bezier-curve we can calculate the curve as a function of t
            var x_t = function(t) {
                    return t * (2 * x1 + x2Minus2x1 * t);
                },
                y_t = function(t) {
                    return t * (2 * y1 + y2Minus2y1 * t);
                };

            // for a non-linear curve, the parameter t will be slightly different
            // so we use newton's method to calculate it numerically
            if(this.edgeType !== GraphEdgeType.LINEAR) {
                // this is the function we want calculate the zero-crossing point for
                // this is basically just the ellipse-equation with x_t and y_t substituted (see the functions x_t and y_t)
                var f = function(t) {
                        // ((x2 - 2 x1)^2 b^2 + (y2 - 2 y1)^2 a^2) t^4 + 4 (x1 (x2 - 2 x1) b^2 + y1 (y2 - 2 y1) a^2) t^3 + 4 (x1^2 b^2 + y1^2 a^2) t^2 - a^2 b^2
                        return (x2Minus2x1 * x2Minus2x1 * bSquared + y2Minus2y1 * y2Minus2y1 * aSquared) * t * t * t * t +
                            4 * (x1 * x2Minus2x1 * bSquared + y1 * y2Minus2y1 * aSquared) * t * t * t +
                            4 * (x1 * x1 * bSquared + y1 * y1 * aSquared) * t * t - aSquared * bSquared;
                    },
                // for newton's method we also need the derivative of the function f, here it is
                    df_dt = function(t) {
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
                var bound = 2 / (Math.abs(x1 * x2 + y1 * y1) + Math.abs(x2 * x2 + y2 * y2)),
                    t_n1;

                // calculate newton's method
                // we do not want this to be an infinite loop, so we set a maximum number of iterations
                for(var n = 0; n < MAXIMUM_STEPS; n++) {
                    t_n1 = t_n;

                    t_n = t_n1 - f(t_n1)/df_dt(t_n1);

                    if(Math.abs(t_n1 - t_n) < bound) {
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
        }

        /**
         * Get the interjection-point of the bezier-curve associated with this edge and the ellipse associated with
         * the end-node - this is the point the arrow points to
         * @returns {*[]}
         */
        getInterjectionPoint(): [number, number]
        {
            return [this.interjectionPoint[0], this.interjectionPoint[1]];
        }

        /**
         * Get the interjection-angle of the bezier-curve associated with this edge and the ellipse associated with
         * the end-node
         * @returns {number}
         */
        getInterjectionAngle(): number
        {
            return 180 * Math.atan2(this.interjectionPoint[3], this.interjectionPoint[2]) / Math.PI;
        }
    }

    export class Node {
        /**
         * The node's name
         */
        private name: string;
        /**
         * The node's type
         */
        private type: NodeType;
        /**
         * A list of all sub-graphs this node belongs to
         */
        private subGraphList: SubGraph[] = [];
        /**
         * A list of all edges that are connected to this node
         * @type {Array}
         */
        private edgeList: Edge[] = [];
        /**
         * A list of all filters this node belongs to
         * @type {Array}
         */
        private filterList: Filter[] = [];
        /**
         * A list of all binds this node belongs to
         * @type {Array}
         */
        private bindList: Bind[] = [];
        /**
         * A list of all unions this node belongs to
         * @type {Array}
         */
        private unionList: Union[] = [];
        /**
         * A list of all order-by-statements this node belongs to
         * @type {Array}
         */
        private orderList: Order[] = [];
        /**
         * A list of all services this node belongs to
         * @type {Array}
         */
        private serviceList: Service[] = [];
        /**
         * The ellipse-parameter a so that x^2 / a^2 + y^2 / b^2 = 1
         */
        rx: number;
        /**
         * The ellipse-parameter b so that x^2 / a^2 + y^2 / b^2 = 1
         */
        ry: number;
        /**
         * x-position of this node
         * This is set by d3 - do not change manually
         */
        x: number;
        /**
         * y-position of this node
         * This is set by d3 - do not change manually
         */
        y: number;

        fixed: boolean = false;

        /**
         * Set up a new node
         * @param name
         * @param type
         */
        constructor(name: string, type: NodeType = NodeType.REGULAR) {
            this.name = name;
            this.type = type;
        }

        /**
         * Get the node's name
         * @returns {string}
         */
        getName(): string {
            return this.name;
        }

        /**
         * Get the node's type
         * @returns {NodeType}
         */
        getType(): NodeType {
            return this.type;
        }

        /**
         * Set the node's type
         * @param type
         * @returns {sparql.Node}
         */
        setType(type: NodeType): this {
            this.type = type;

            return this;
        }

        isSelect(): boolean {
            return this.type === NodeType.SELECT;
        }

        /**
         * Get all sub-graphs this node belongs to
         * @returns {SubGraph[]}
         */
        getSubGraphList(): SubGraph[] {
            return this.subGraphList;
        }

        /**
         * Add a sub-graph this node belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param subGraph
         * @returns {sparql.Node}
         */
        addSubGraph(subGraph: SubGraph): this {
            this.subGraphList.push(subGraph);

            subGraph.addNode(this);

            return this;
        }

        /**
         * Get all edges that are connected to this node
         * @returns {Edge[]}
         */
        getEdgeList(): Edge[] {
            return this.edgeList;
        }

        /**
         * Add an edge that is connected to this node
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param edge
         * @returns {sparql.Node}
         */
        addEdge(edge: Edge): this {
            this.edgeList.push(edge);
            
            return this;
        }

        /**
         * Get all filters this node belongs to
         * @returns {Filter[]}
         */
        getFilterList(): Filter[] {
            return this.filterList;
        }

        /**
         * Add a filter that this node belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param filter
         * @returns {sparql.Node}
         */
        addFilter(filter: Filter): this {
            this.filterList.push(filter);
            
            return this;
        }

        /**
         * Get all binds this node belongs to
         * @returns {Bind[]}
         */
        getBindList(): Bind[] {
            return this.bindList;
        }

        /**
         * Add a filter that this node belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param bind
         * @returns {sparql.Node}
         */
        addBind(bind: Bind): this {
            this.bindList.push(bind);

            return this;
        }

        /**
         * Get all unions this node belongs to
         * @returns {Union[]}
         */
        getUnionList(): Union[] {
            return this.unionList;
        }

        /**
         * Add a union that this node belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param union
         * @returns {sparql.Node}
         */
        addUnion(union: Union): this {
            for(var u in this.unionList)
            {
                if(u === union.toString())
                {
                    return this;
                }
            }

            this.unionList.push(union);

            return this;
        }

        /**
         * Get all unions this node belongs to
         * @returns {Order[]}
         */
        getOrderList(): Order[] {
            return this.orderList;
        }

        /**
         * Add a order-by-statement that this node belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param order
         * @returns {sparql.Node}
         */
        addOrder(order: Order): this {
            this.orderList.push(order);

            return this;
        }

        /**
         * Get all services this node belongs to
         * @returns {Service[]}
         */
        getServiceList(): Service[] {
            return this.serviceList;
        }

        /**
         * Add a service that this node belongs to
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param service
         * @returns {sparql.Node}
         */
        addService(service: Service): this {
            this.serviceList.push(service);

            service.addNode(this);

            return this;
        }

        /**
         * Get x-position
         * @returns {number}
         */
        getX(): number {
            return this.x;
        }

        /**
         * Get y-position
         * @returns {number}
         */
        getY(): number {
            return this.y;
        }

        /**
         * Get the ellipse-parameter a with x^2 / a^2 + y^2 / b^2 = 1
         * @returns {number}
         */
        getEllipseParameterX(): number {
            return this.rx * 0.6;
        }

        /**
         * Get the ellipse-parameter b with x^2 / a^2 + y^2 / b^2 = 1
         * @returns {number}
         */
        getEllipseParameterY(): number {
            return this.ry * 0.9;
        }
    }

    export class SubGraph {
        /**
         * The sub-graph's name
         */
        private name: string;
        /**
         * A list of all nodes that are inside this sub-graph
         * @type {Array}
         */
        private nodeList: Node[] = [];
        /**
         * A list of all edges that are inside this sub-graph
         * @type {Array}
         */
        private edgeList: Edge[] = [];

        /**
         * Set up a new sub-graph
         * @param name
         */
        constructor(name: string) {
            this.name = name;
        }

        /**
         * Get the sub-graph's name
         * @returns {string}
         */
        getName(): string
        {
            return this.name;
        }

        /**
         * Get all nodes that are inside this sub-graph
         * @returns {Node[]}
         */
        getNodeList(): Node[] {
            return this.nodeList;
        }

        /**
         * Add a node to this sub-graph
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param node
         * @returns {SubGraph}
         */
        addNode(node: Node): this {
            for(var containingNode of this.nodeList)
            {
                if(containingNode === node)
                {
                    return this;
                }
            }

            this.nodeList.push(node);

            return this;
        }

        /**
         * Get all edges that are inside this sub-graph
         * @returns {Edge[]}
         */
        getEdgeList(): Edge[] {
            return this.edgeList;
        }

        /**
         * Add an edge to this sub-graph
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param edge
         * @returns {SubGraph}
         */
        addEdge(edge: Edge): this {
            for(var containingEdge of this.edgeList)
            {
                if(containingEdge === edge)
                {
                    return this;
                }
            }

            this.edgeList.push(edge);

            return this;
        }
    }

    export class Service {
        /**
         * The service's name
         */
        private name: string;
        /**
         * A list of all nodes that are inside this service
         * @type {Array}
         */
        private nodeList: Node[] = [];
        /**
         * A list of all edges that are inside this service
         * @type {Array}
         */
        private edgeList: Edge[] = [];

        /**
         * Set up a new service
         * @param name
         */
        constructor(name: string) {
            this.name = name;
        }

        /**
         * Get the service's name
         * @returns {string}
         */
        getName(): string
        {
            return this.name;
        }

        /**
         * Get all nodes that are inside this service
         * @returns {Node[]}
         */
        getNodeList(): Node[] {
            return this.nodeList;
        }

        /**
         * Add a node to this service
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param node
         * @returns {SubGraph}
         */
        addNode(node: Node): this {
            for(var containingNode of this.nodeList)
            {
                if(containingNode === node)
                {
                    return this;
                }
            }

            this.nodeList.push(node);

            return this;
        }

        /**
         * Get all edges that are inside this service
         * @returns {Edge[]}
         */
        getEdgeList(): Edge[] {
            return this.edgeList;
        }

        /**
         * Add an edge to this service
         * NOTE: Usually you would not call this function manually!
         * Returns this for a fluent interface
         * @param edge
         * @returns {SubGraph}
         */
        addEdge(edge: Edge): this {
            for(var containingEdge of this.edgeList)
            {
                if(containingEdge === edge)
                {
                    return this;
                }
            }

            this.edgeList.push(edge);

            return this;
        }
    }

    export class Union {
        /**
         * The union's name
         */
        private name: string;
        /**
         * A list of all edges that belong to this union
         * @type {Array}
         */
        private edgeList: Edge[] = [];

        /**
         * Set up a new union
         * @param name
         */
        constructor(name: string) {
            this.name = name;
        }

        /**
         * Get the union's name
         * @returns {string}
         */
        getName(): string {
            return this.name;
        }

        /**
         * Get all edges that belong to this union
         * @returns {Edge[]}
         */
        getEdgeList(): Edge[] {
            return this.edgeList;
        }

        /**
         * Add a new edge to this union
         * @param edge
         * @returns {Union}
         */
        addEdge(edge: Edge): this {
            this.edgeList.push(edge);

            edge.addUnion(this);

            return this;
        }
    }

    export class Filter {
        /**
         * The textual representation of this filter
         */
        private text: string;
        /**
         * A list of all edges that belong to this filter
         * @type {Array}
         */
        private edgeList: Edge[] = [];
        /**
         * A list of all nodes that belong to this filter
         * @type {Array}
         */
        private nodeList: Node[] = [];

        /**
         * Set up a new filter
         * @param text
         */
        constructor(text: string) {
            this.text = text;
        }

        /**
         * Get the textual representation of this filter
         * @returns {string}
         */
        getText(): string {
            return this.text;
        }

        /**
         * Get all edges that belong to this filter
         * @returns {Edge[]}
         */
        getEdgeList(): Edge[] {
            return this.edgeList;
        }

        /**
         * Add a new edge to this filter
         * @param edges
         * @returns {Filter}
         */
        addEdge(edges: Edge[]): this {
            for(var edge of edges)
            {
                this.edgeList.push(edge);

                edge.addFilter(this);
            }

            return this;
        }

        /**
         * Get all nodes that belong to this filter
         * @returns {Node[]}
         */
        getNodeList(): Node[] {
            return this.nodeList;
        }

        /**
         * Add a new node to this filter
         * @param node
         * @returns {Filter}
         */
        addNode(node: Node): this {
            if(node !== null)
            {
                this.nodeList.push(node);

                node.addFilter(this);
            }

            return this;
        }
    }

    export class Bind {
        /**
         * The textual representation of this bind
         */
        private text: string;
        /**
         * A list of all edges that belong to this bind
         * @type {Array}
         */
        private edgeList: Edge[] = [];
        /**
         * A list of all nodes that belong to this bind
         * @type {Array}
         */
        private nodeList: Node[] = [];

        /**
         * Set up a new bind
         * @param text
         */
        constructor(text: string) {
            this.text = text;
        }

        /**
         * Get the textual representation of this bind
         * @returns {string}
         */
        getText(): string {
            return this.text;
        }

        /**
         * Get all edges that belong to this bind
         * @returns {Edge[]}
         */
        getEdgeList(): Edge[] {
            return this.edgeList;
        }

        /**
         * Add a new edge to this bind
         * @param edges
         * @returns {Filter}
         */
        addEdge(edges: Edge[]): this {

            for(var edge of edges)
            {
                this.edgeList.push(edge);

                edge.addBind(this);
            }

            return this;
        }

        /**
         * Get all nodes that belong to this bind
         * @returns {Node[]}
         */
        getNodeList(): Node[] {
            return this.nodeList;
        }

        /**
         * Add a new node to this bind
         * @param node
         * @returns {Filter}
         */
        addNode(node: Node): this {
            if(node !== null)
            {
                this.nodeList.push(node);

                node.addBind(this);
            }

            return this;
        }
    }

    export class Order {
        /**
         * A list of all edges that belong to this order
         * @type {Array}
         */
        private edgeList: Edge[] = [];
        /**
         * A list of all nodes that belong to this order
         * @type {Array}
         */
        private nodeList: Node[] = [];

        getText(): string {
            var text = [];

            for(var edge of this.edgeList) {
                text.push(edge.getName());
            }

            for(var node of this.nodeList) {
                text.push(node.getName());
            }

            return text.join(', ');
        }

        /**
         * Get all edges that belong to this order
         * @returns {Edge[]}
         */
        getEdgeList(): Edge[] {
            return this.edgeList;
        }

        /**
         * Add a new edge to this order
         * @param edge
         * @returns {Filter}
         */
        addEdge(edge: Edge): this {
            this.edgeList.push(edge);

            edge.addOrder(this);

            return this;
        }

        /**
         * Get all nodes that belong to this order
         * @returns {Node[]}
         */
        getNodeList(): Node[] {
            return this.nodeList;
        }

        /**
         * Add a new node to this order
         * @param node
         * @returns {Filter}
         */
        addNode(node: Node): this {
            this.nodeList.push(node);

            node.addOrder(this);

            return this;
        }
    }
}