import {
    Definition,
    DefinitionLink,
    DocumentHighlight,
    DocumentHighlightKind,
    DocumentSymbol,
    HandlerResult,
    Location,
    Position,
    PublishDiagnosticsParams,
    Range,
    SemanticTokens,
    SemanticTokensBuilder,
    SymbolInformation,
    TextDocuments,
    TextEdit,
    WorkspaceEdit,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Token } from "../jsbleep/Token";
import { TOKEN_TO_ID } from "./SemanticTokenAnalyzer";
import { BleepDocument } from "./BleepDocument";

type LspEventListner = ((type: "diagnostics", params: PublishDiagnosticsParams) => void) &
    ((type: "foo", params: any) => void);

export class BleepLspServer {
    bleepDocuments: Map<string, BleepDocument> = new Map();

    constructor(private documents: TextDocuments<TextDocument>, private listener: LspEventListner) {
        this.documents.onDidChangeContent((change) => {
            this.onDidChangeContent(change.document.uri);
        });

        this.documents.onDidClose((event) => {
            this.bleepDocuments.delete(event.document.uri);
        });
    }

    onDidChangeContent(uri: string) {
        let bleepDocument = this.bleepDocuments.get(uri);
        if (!bleepDocument) {
            const document = this.documents.get(uri);
            if (document) {
                bleepDocument = new BleepDocument(document);
                this.bleepDocuments.set(uri, bleepDocument);
            }
        }

        if (bleepDocument) {
            bleepDocument.analyze();
            this.listener("diagnostics", {
                uri: uri,
                diagnostics: bleepDocument.diagnostics,
            });
        }
    }

    onDefinition(uri: string, position: Position): Definition | DefinitionLink[] | null {
        const bleepDocument = this.bleepDocuments.get(uri);
        if (!bleepDocument) {
            return null;
        }

        const offset = bleepDocument.document.offsetAt(position);
        for (const [reference, definition] of bleepDocument.references) {
            if (reference.start <= offset && reference.end >= offset) {
                return {
                    uri: bleepDocument.document.uri,
                    range: {
                        start: bleepDocument.document.positionAt(definition.start),
                        end: bleepDocument.document.positionAt(definition.end),
                    },
                };
            }
        }
        return null;
    }

    onReferences(uri: string, position: Position): HandlerResult<Location[] | null | undefined, void> {
        const bleepDocument = this.bleepDocuments.get(uri);
        if (!bleepDocument) {
            return null;
        }

        const offset = bleepDocument.document.offsetAt(position);

        for (const [definition, references] of bleepDocument.definitions) {
            if (definition.start <= offset && definition.end >= offset) {
                const locations: Location[] = [];
                for (const reference of references || []) {
                    locations.push({
                        uri: bleepDocument.document.uri,
                        range: {
                            start: bleepDocument.document.positionAt(reference.start),
                            end: bleepDocument.document.positionAt(reference.end),
                        },
                    });
                }
                return locations;
            }
        }
        return null;
    }

    onSemanticTokens(uri: string): HandlerResult<SemanticTokens, void> {
        const bleepDocument = this.bleepDocuments.get(uri);
        if (!bleepDocument || !bleepDocument.semanticTokens) {
            return { data: [] };
        }

        const builder = new SemanticTokensBuilder();
        for (const token of bleepDocument.semanticTokens) {
            const { line, character } = bleepDocument.document.positionAt(token.start);
            const length = token.end - token.start;
            const typeId = TOKEN_TO_ID[token.type];

            console.log(token, typeId);
            builder.push(line, character, length, typeId, 0);
        }

        return builder.build();
    }

    onDocumentSymbol(uri: string): HandlerResult<SymbolInformation[] | DocumentSymbol[] | null | undefined, void> {
        const bleepDocument = this.bleepDocuments.get(uri);
        if (!bleepDocument || !bleepDocument.documentSymbols) {
            return [];
        }

        return bleepDocument.documentSymbols;
    }

    onRename(uri: string, position: Position, newName: string): HandlerResult<WorkspaceEdit | null | undefined, void> {
        const bleepDocument = this.bleepDocuments.get(uri);
        if (!bleepDocument || !bleepDocument.definitions) {
            return null;
        }

        const edits: Array<TextEdit> = bleepDocument.findAllFromPosition(position).map((token) => {
            return {
                range: {
                    start: bleepDocument.document.positionAt(token.start),
                    end: bleepDocument.document.positionAt(token.end),
                },
                newText: newName,
            };
        });

        return {
            changes: {
                [uri]: edits,
            },
        };
    }

    onPrepareRename(
        uri: string,
        position: Position
    ): HandlerResult<
        Range | { range: Range; placeholder: string } | { defaultBehavior: boolean } | null | undefined,
        void
    > {
        const bleepDocument = this.bleepDocuments.get(uri);
        if (!bleepDocument || !bleepDocument.definitions) {
            return null;
        }

        const offset = bleepDocument.document.offsetAt(position);
        for (const definition of bleepDocument.definitions.keys()) {
            if (definition.start <= offset && definition.end >= offset) {
                return {
                    range: {
                        start: bleepDocument.document.positionAt(definition.start),
                        end: bleepDocument.document.positionAt(definition.end),
                    },
                    placeholder: definition.lexeme,
                };
            }
            for (const reference of bleepDocument.definitions.get(definition) || []) {
                if (reference.start <= offset && reference.end >= offset) {
                    return {
                        range: {
                            start: bleepDocument.document.positionAt(reference.start),
                            end: bleepDocument.document.positionAt(reference.end),
                        },
                        placeholder: reference.lexeme,
                    };
                }
            }
        }
        return null;
    }

    onDocumentHighlight(uri: string, position: Position): HandlerResult<DocumentHighlight[] | null | undefined, void> {
        const bleepDocument = this.bleepDocuments.get(uri);
        if (!bleepDocument || !bleepDocument.definitions) {
            return null;
        }

        const symbols = bleepDocument.findAllFromPosition(position);
        if (!symbols.length) {
            return null;
        }

        return symbols.map((symbol) => {
            return {
                range: {
                    start: bleepDocument.document.positionAt(symbol.start),
                    end: bleepDocument.document.positionAt(symbol.end),
                },
                kind: DocumentHighlightKind.Text,
            };
        });
    }
}
