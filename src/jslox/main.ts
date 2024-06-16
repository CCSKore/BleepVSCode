import * as fs from "fs/promises";
import * as repl from "node:repl";
import { Bleep } from "./Bleep";

export async function runFile(filename: string) {
    const bleep = new Bleep();
    const source = await fs.readFile(filename, "utf8");
    await lox.run(source);
    if (lox.hadError) {
        process.exit(65);
    }
    if (lox.hadRuntimeError) {
        process.exit(70);
    }
}

export async function runPrompt() {
    const bleep = new Bleep();

    return await new Promise<void>((resolve, reject) => {
        const replServer = repl.start({
            prompt: "jsbleep> ",
            eval: (cmd, context, filename, callback) => {
                if (bleep.isExpression(cmd)) {
                    const result = bleep.evaluateExpression(cmd);
                    bleep.hadError = false;
                    bleep.hadRuntimeError = false;
                    callback(null, result);
                } else {
                    bleep.run(cmd);
                    bleep.hadError = false;
                    bleep.hadRuntimeError = false;
                    callback(null, null);
                }
            },
        });

        replServer.on("exit", () => {
            resolve();
        });
    });
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length > 1) {
        console.log("Usage: jbleep [script]");
        process.exit(64);
    } else if (args.length === 1) {
        await runFile(args[0]);
    } else {
        await runPrompt();
    }
}

if (require.main === module) {
    main();
}
