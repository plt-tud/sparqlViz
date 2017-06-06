module GraphicalSpraql {
    /**
     * Hauptklasse
     * ist für das binding an die Umgebung gedacht
     */
    class GraphicalSparql {
        constructor(svgElement: HTMLElement) { }

        bindTextarea(textArea: HTMLTextAreaElement, button: HTMLButtonElement, typingDelay: number = Infinity) { }
    }

    /**
     * Analysiert die Query und erzeugt den Graphen
     */
    class QueryAnalyzer {
        constructor(visualizer: QueryVisualizer) { }

        analizeQuery(text: string) { }
    }

    /**
     * Nimmt das Analyseergebnis und stellt es in dem SVG-Element dar
     */
    class QueryVisualizer {
        constructor(svgElement: HTMLElement) { }
    }

    interface SparqlGraphElementInterface { }

    /**
     * Ein SPARQL-Graph
     * Nodes im Graphen (dies können wiederum auch Subgrahen sein) werden ungeordent gespeichert.
     * Verbindungen zwischen den Nodes werden im Node selbst gespeichert. Dies vereinfacht die Darstellungsberechnung
     */
    class SparqlGraph implements SparqlGraphElementInterface{
        constructor(label: string = '') { }

        addNode(node: SparqlGraphElementInterface) { }
    }

    /**
     * Ein Node des Graphen
     * Dies kann entweder ein Subjekt oder ein Objekt sein
     */
    class SparqlNode implements SparqlGraphElementInterface {
        constructor(label: string) { }

        setFrom(connector: SparqlNodeConnection) { }

        addTo(connector: SparqlNodeConnection) { }
    }

    /**
     * Repräsentiert das Prädikat des Tripels
     */
    class SparqlNodeConnection {
        constructor(label: string, from: SparqlNode, to: SparqlNode) { }
    }
}