import { RuntimeError } from "./Error";
import { BleepType } from "./Interpreter";
import { BleepClass } from "./BleepClass";
import { Token } from "./Token";

export class BleepInstance {
    private fields = new Map<string, BleepType>();

    constructor(public klass: BleepClass) { }

    get(name: Token): BleepType {
        if (this.fields.has(name.lexeme)) {
            return this.fields.get(name.lexeme)!;
        }

        const method = this.klass.findMethod(name.lexeme);
        if (method) {
            return method.bind(this);
        }

        throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
    }

    set(name: Token, value: BleepType): void {
        this.fields.set(name.lexeme, value);
    }

    toString(): string {
        return `<instance of ${this.klass.name}>`;
    }
}
