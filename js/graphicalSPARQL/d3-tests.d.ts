/// <reference path="../../node_modules/@types/d3/index.d.ts" />
/// <reference path="../../node_modules/@types/angular/index.d.ts" />
// <reference path="../graphicalSPARQL/classes.ts" />

interface sparqlNode {
    object: sparql.Node
}

interface transformedSparqlNode extends sparqlNode, d3.layout.force.Node {
    rx: number;
    ry: number;
}

interface sparqlNodeLink extends d3.layout.force.Link<number> {
    object: sparql.Edge
}

interface transformedSparqlNodeLink extends d3.layout.force.Link<transformedSparqlNode> {
    object: sparql.Edge
}

interface nodeElement extends HTMLElement {
    __data__: transformedSparqlNode;
}

interface linkElement extends HTMLElement {
    __data__: transformedSparqlNodeLink;
}