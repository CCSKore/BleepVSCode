import { Callable } from "./BleepFunction";
import { Interpreter, BleepType } from "./Interpreter";
import { BleepInstance } from "./BleepInstance";

export class BleepClass extends Callable {
    constructor(public name: string, readonly superclass: BleepClass | null, readonly methods: Map<string, Callable>) {
        super();
    }

    get arity(): number {
        const initializer = this.findMethod("init");
        if (initializer) {
            return initializer.arity;
        }
        return 0;
    }

    findMethod(lexeme: string): Callable | undefined {
        if (this.methods.has(lexeme)) {
            return this.methods.get(lexeme);
        }

        if (this.superclass) {
            return this.superclass.findMethod(lexeme);
        }

        return;
    }

    call(interpreter: Interpreter, args: BleepType[]): BleepType {
        const instance = new BleepInstance(this);
        const initializer = this.findMethod("init");
        if (initializer) {
            initializer.bind(instance).call(interpreter, args);
        }
        return instance;
    }

    toString(): string {
        return `<class ${this.name}>`;
    }
}
