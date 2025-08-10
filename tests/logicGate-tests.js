// This is a new file, so there is no previous content.
// This is a new file, so there is no previous content.
import { parse } from '../src/ui/logicGate.js';

function runTest(name, expression) {
    console.log(`--- Running test: ${name} ---`);
    try {
        const ast = parse(expression);
        console.log(`Expression: ${expression}`);
        console.log('AST:', JSON.stringify(ast, null, 2));
        console.log('Result: OK');
    } catch (error) {
        console.error(`Error parsing expression: ${expression}`);
        console.error(error);
        console.log('Result: FAILED');
    }
    console.log('\n');
}

runTest('Simple AND', 'A&B');
runTest('Simple OR', 'A|B');
runTest('Simple NOT', '!A');
runTest('Complex Expression', 'A&!B|C');
runTest('Expression with Parentheses', '(A|B)&C');
