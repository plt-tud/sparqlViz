var GraphicalSpraql;
(function (GraphicalSpraql) {
    /**
     * Hauptklasse
     * ist für das binding an die Umgebung gedacht
     */
    var GraphicalSparql = (function () {
        function GraphicalSparql(svgElement) {
        }
        GraphicalSparql.prototype.bindTextarea = function (textArea, button, typingDelay) {
            if (typingDelay === void 0) { typingDelay = Infinity; }
        };
        return GraphicalSparql;
    }());
    /**
     * Analysiert die Query und erzeugt den Graphen
     */
    var QueryAnalyzer = (function () {
        function QueryAnalyzer(visualizer) {
        }
        QueryAnalyzer.prototype.analizeQuery = function (text) { };
        return QueryAnalyzer;
    }());
    /**
     * Nimmt das Analyseergebnis und stellt es in dem SVG-Element dar
     */
    var QueryVisualizer = (function () {
        function QueryVisualizer(svgElement) {
        }
        return QueryVisualizer;
    }());
    /**
     * Ein SPARQL-Graph
     * Nodes im Graphen (dies können wiederum auch Subgrahen sein) werden ungeordent gespeichert.
     * Verbindungen zwischen den Nodes werden im Node selbst gespeichert. Dies vereinfacht die Darstellungsberechnung
     */
    var SparqlGraph = (function () {
        function SparqlGraph(label) {
            if (label === void 0) { label = ''; }
        }
        SparqlGraph.prototype.addNode = function (node) { };
        return SparqlGraph;
    }());
    /**
     * Ein Node des Graphen
     * Dies kann entweder ein Subjekt oder ein Objekt sein
     */
    var SparqlNode = (function () {
        function SparqlNode(label) {
        }
        SparqlNode.prototype.setFrom = function (connector) { };
        SparqlNode.prototype.addTo = function (connector) { };
        return SparqlNode;
    }());
    /**
     * Repräsentiert das Prädikat des Tripels
     */
    var SparqlNodeConnection = (function () {
        function SparqlNodeConnection(label, from, to) {
        }
        return SparqlNodeConnection;
    }());
})(GraphicalSpraql || (GraphicalSpraql = {}));
