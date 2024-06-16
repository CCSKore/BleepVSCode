import { Callable } from "./BleepFunction";
import { Environment } from "./Environment";
import { Interpreter, BleepType } from "./Interpreter";

export class Buildins extends Environment {
    constructor() {
        super();
        this.addBuildin("clock", 0, () => Date.now() / 1000);
    }

    private addBuildin(name: string, arity: number, fn: (args: Array<BleepType>) => BleepType) {
        this.define(name, new BuildinCallable(name, arity, fn));
    }
}

export class BuildinCallable extends Callable {
    constructor(private name: string, readonly arity: number, private readonly fn: (args: Array<BleepType>) => BleepType) {
        super();
    }

    call(interpreter: Interpreter, args: Array<BleepType>): BleepType {
        return this.fn(args);
    }

    toString(): string {
        return `<native ${this.name}>`;
    }
}
