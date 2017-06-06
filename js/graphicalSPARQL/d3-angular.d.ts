/// <reference path="../angular/angular.d.ts" />
/// <reference path="../graphicalSPARQL/classes.ts" />

interface graphControllerScope extends angular.IScope {
    nodes: sparql.Node[];
    edges: sparql.Edge[];
    subGraphs: sparql.SubGraph[];
    binds: sparql.Bind[];
    filters: sparql.Filter[];
    unions: sparql.Union[];
    orders: sparql.Order[];
    services: sparql.Service[];
    limit: number;
    highlightService: highlightService;
    dragNodeService: dragNodeService;
    parseQueryService: parseQueryService;
    $location;

    graphSize: {height: number; width: number;};
}

interface highlightService {
    highlight(object);
    isHighlighted(object): boolean;
}

interface dragNodeService {
    dragNode(node: sparql.Node);
    moveNode(event);
}

interface parseQueryService {
    parse(newQuery: string);
    getObject();
}

interface repeatingNodeScope extends angular.IScope {
    node: sparql.Node;
}

interface repeatingLinkScope extends angular.IScope {
    edge: sparql.Edge;
}