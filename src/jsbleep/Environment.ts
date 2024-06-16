import { RuntimeError } from "./Error";
import { BleepType } from "./Interpreter";
import { Token } from "./Token";

export class Environment {
    private readonly values: Map<string, BleepType> = new Map();

    constructor(readonly enclosing?: Environment) {}

    define(name: string, value: BleepType): void {
        this.values.set(name, value);
    }

    get(name: Token): BleepType {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme)!;
        }

        if (this.enclosing) {
            return this.enclosing.get(name);
        }

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    getAt(distance: number, lexeme: string): BleepType {
        return this.ancestor(distance).values.get(lexeme)!;
    }

    ancestor(distance: number): Environment {
        let environment: Environment = this;
        for (let i = 0; i < distance; i++) {
            environment = environment.enclosing!;
        }
        return environment;
    }

    assign(name: Token, value: BleepType): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }

        if (this.enclosing) {
            this.enclosing.assign(name, value);
            return;
        }

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    assignAt(distance: number, name: Token, value: BleepType) {
        this.ancestor(distance).values.set(name.lexeme, value);
    }

    // mostly for testing
    getByName(name: string): BleepType {
        if (this.values.has(name)) {
            return this.values.get(name)!;
        }

        if (this.enclosing) {
            return this.enclosing.getByName(name);
        }

        throw new Error(`Undefined variable '${name}'.`);
    }
}
