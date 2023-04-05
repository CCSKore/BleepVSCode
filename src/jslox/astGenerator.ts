/* eslint-disable @typescript-eslint/naming-convention */
const grammar: Record<string, Array<string>> = {
    "Binary Expr": ["Expr left", "Token operator", "Expr right"],
    "Grouping Expr": ["Expr expression"],
    "Literal Expr": ["string|number|null|boolean value"],
    "Unary Expr": ["Token operator", "Expr right"],
    "Expression Stmt": ["Expr expression"],
    "Print Stmt": ["Expr expression"],
};

const header = `import { Token } from "./Token";

export interface Expr {
    visit<R>(visitor: Visitor<R>): R;
}

export interface Stmt {
    visit<R>(visitor: Visitor<R>): R;
}

`;

function getClassSource(className: string, parent: string, fields: Array<string>) {
    fields = fields.map((f) => {
        const [type, name] = f.split(" ");
        return `readonly ${name}: ${type}`;
    });

    return `export class ${className} implements ${parent} {
    constructor(${fields.join(", ")}) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visit${className}(this);
    }
}

`;
}

function getVisitorSource(classNames: Array<string>) {
    return `export interface Visitor<R> {
${classNames.map((c) => `    visit${c}(${c.toLowerCase()}: ${c}): R;`).join("\n")}
}

`;
}

async function main() {
    let source = header;

    const classes = Object.keys(grammar).map((g) => g.split(" "));

    source += getVisitorSource(classes.map((c) => c[0]));

    for (const cls of classes) {
        const fields = grammar[`${cls[0]} ${cls[1]}`];
        if (!fields) {
            return;
        }
        source += getClassSource(cls[0], cls[1], fields!);
    }

    console.log(source);
}

if (require.main === module) {
    main();
}
