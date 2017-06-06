/**
 * The sparqlJs module containing all interfaces used by sparqljs
 */

declare module sparqlJs {
    /**
     * The main interface, that is accessible from the outside
     * It provides the parser and the generator
     */
    export interface sparqlJs {
        Parser(prefixes?: string[]): sparqlJsParser;
        Generator(): sparqlJsGenerator;
    }

    /**
     * The sparqlJs-parser: It's main purpose is to pare a query-string to a sparqlJsJson object,
     * so only this functionality is included in this interface
     */
    export interface sparqlJsParser {
        parse(query: string): sparqlJsJson;
    }

    /**
     * The sparqlJs-generator: It compiles a sparqlJsJson object back to a string
     */
    export interface sparqlJsGenerator {
        stringify(querySpecification: sparqlJsJson): string;
        toPattern(pattern: sparqlJsPattern): string;
    }

    /**
     * The main interchange format for sparql-queries
     */
    export interface sparqlJsJson {
        /**
         * SELECT queries only
         * Determines whether the select is distinct
         * If not provided, false is assumed
         */
        distinct?: boolean;
        /**
         * SELECT queries only
         * Add data-source(s)
         */
        from?: {
            /**
             * The unnamed data-source(s)
             */
            'default': string[];
            /**
             * The named data-source(s)
             */
            named: string[];
        };
        /**
         * GROUP BY
         * TODO
         */
        group?: any;
        /**
         * HAVING
         * TODO
         */
        having?: any;
        /**
         * The number of results that should be affected
         * If not provided, no limit is assumed
         */
        limit?: number;
        /**
         * The first result that should be affected
         * If not provided, 0 is assumed
         */
        offset?: number;
        /**
         * ORDER BY
         */
        order?: any;
        /**
         * The prefixes used in this query
         * prefixes[prefixName] = URI
         */
        prefixes: Dictionary<string>;
        /**
         * The query-type
         * This is the string, that stands right at the start of the query (e.g. select, delete, …)
         */
        queryType?: string;
        template?: sparqlTriple[];
        type: string;
        updates?: sparqlJsUpdate[];
        variables?: string[];
        where?: sparqlJsWhere[];
    }

    export interface sparqlTriple {
        subject: string;
        predicate: string;
        object: string;
    }

    export interface sparqlJsWhere {
        name?: string;
        patterns: sparqlJsPattern[];
        silent?: boolean;
        type: string;
    }

    export interface sparqlJsPattern {
        expression?: sparqlJsWherePatternExpression;
        name?: string;
        triples?: sparqlTriple[];
        variable?: string;
        type: string;
    }

    export interface sparqlJsWherePatternExpression {
        type: string;
        operator: string;
        args: Array<sparqlJsWherePatternExpression|string>;
    }

    export interface sparqlJsUpdate {
        'delete': sparqlJsPattern[];
        updateType: string;
        insert: sparqlJsPattern[];
        type: string;
        where: sparqlJsWhere[];
    }

    export interface Dictionary<T> {
        [index: string]: T;
    }
}

declare var sparqljs: sparqlJs.sparqlJs;