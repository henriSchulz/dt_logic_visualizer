import { logicState, customFunctionState } from "../state.js";
import { normalizeExpression, getMinimalExpression } from "../logic/parser.js";
import {$} from "../utils/utils.js";

export function renderLogicGate() {
  const logicGateCard = document.getElementById("logicGateCard");
  if (!logicGateCard) return;

  const container = document.getElementById("logic-gate-container");
  if (!container) return;

  container.innerHTML = ""; // Clear previous content

  const expression = getMinimalExpression();

  if (!expression || expression === "0" || expression === "1") {
    container.innerHTML = `<div class="p-4 text-center text-gray-500">Keine Logikgatter für Konstanten darstellbar.</div>`;
    return;
  }

  const normalizedExpr = normalizeExpression(expression);

  const selectInput = document.getElementById('gate-input-select');
  if (selectInput && !selectInput.dataset.listener) {
      selectInput.addEventListener('change', renderLogicGate);
      selectInput.dataset.listener = 'true';
  }

  const maxInputs = parseInt(selectInput.value, 10);

  try {
    let ast = parse(normalizedExpr);
    if (maxInputs > 1) {
        ast = factorAst(ast, maxInputs);
    }
    const svg = renderSvg(ast);
    container.appendChild(svg);
  } catch (error) {
    console.error("Error rendering logic gate:", error);
    container.innerHTML = `<div class="p-4 text-center text-red-500">Fehler beim Darstellen des Logikgatters: ${error.message}</div>`;
  }
}

// ----------------- Parser -----------------
let tokens = [];
let currentToken = 0;

export function parse(expression) {
    const sanitized = expression.replace(/\s/g, '');
    tokens = sanitized.match(/!|[A-Z]|&|\||\(|\)/g) || [];
    currentToken = 0;
    const ast = parseOr();
    if (currentToken < tokens.length) {
        throw new Error(`Unerwartetes Token: ${tokens[currentToken]}`);
    }
    return ast;
}

function eat(tokenType) {
    if (currentToken < tokens.length && tokens[currentToken] === tokenType) {
        currentToken++;
    } else {
        throw new Error(`Erwartet: ${tokenType}, aber gefunden: ${tokens[currentToken]}`);
    }
}

function parseOr() {
    let node = parseAnd();
    const children = [node];
    while (currentToken < tokens.length && tokens[currentToken] === '|') {
        eat('|');
        children.push(parseAnd());
    }
    return children.length === 1 ? children[0] : { type: 'operator', op: '|', children: children };
}

function parseAnd() {
    let node = parseFactor();
    const children = [node];
    while (currentToken < tokens.length && tokens[currentToken] === '&') {
        eat('&');
        children.push(parseFactor());
    }
    return children.length === 1 ? children[0] : { type: 'operator', op: '&', children: children };
}

function parseFactor() {
    const token = tokens[currentToken];
    if (token === '!') {
        eat('!');
        return { type: 'operator', op: '!', children: [parseFactor()] };
    } else if (/[A-Z]/.test(token)) {
        eat(token);
        return { type: 'variable', name: token };
    } else if (token === '(') {
        eat('(');
        const node = parseOr();
        eat(')');
        return node;
    } else {
        throw new Error(`Unerwartetes Token: ${token}`);
    }
}


// ----------------- SVG Renderer -----------------
const GATE_WIDTH = 60;
const GATE_HEIGHT = 40;
const NOT_GATE_SIZE = 40;
const LEVEL_SEPARATION = 100;
const SIBLING_SEPARATION = 30;
const PADDING = 20;

let y_pos = 0;
let max_level = 0;

function renderSvg(ast) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(g);

    y_pos = PADDING;
    max_level = 0;

    layout(ast, 0);

    const totalWidth = (max_level + 1) * LEVEL_SEPARATION + GATE_WIDTH + PADDING * 2;
    const totalHeight = y_pos + PADDING;

    svg.setAttribute("width", "100%");
    svg.setAttribute("height", totalHeight);
    svg.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);

    reverseLayout(ast, max_level);

    draw(g, ast);

    return svg;
}

function layout(node, level) {
    if (!node) return;

    node.level = level;
    if(level > max_level) max_level = level;

    if (node.type === 'variable') {
        node.y = y_pos;
        y_pos += GATE_HEIGHT + SIBLING_SEPARATION;
        return;
    }

    if (node.children) {
        let y_sum = 0;
        node.children.forEach(child => {
            layout(child, level + 1);
            y_sum += child.y;
        });
        node.y = y_sum / node.children.length;
    }
}

function reverseLayout(node, max_level) {
    if (!node) return;
    node.x = (max_level - node.level) * LEVEL_SEPARATION + PADDING;
    if (node.children) {
        node.children.forEach(child => reverseLayout(child, max_level));
    }
}


function draw(g, node) {
    if (!node) return;

    createGate(g, node);

    if (node.children) {
        node.children.forEach((child, index) => {
            connect(g, node, child, index);
            draw(g, child);
        });
    }
}

function createGate(g, node) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const isNot = node.op === '!';
    const width = isNot ? NOT_GATE_SIZE : GATE_WIDTH;
    const height = isNot ? NOT_GATE_SIZE : GATE_HEIGHT;

    if (node.type === 'variable') {
        group.setAttribute("transform", `translate(${node.x}, ${node.y - height / 2})`);
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", 0);
        text.setAttribute("y", height / 2);
        text.setAttribute("text-anchor", "start");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("font-size", "20");
        text.textContent = node.name;
        group.appendChild(text);
    } else {
        group.setAttribute("transform", `translate(${node.x}, ${node.y - height / 2})`);

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", width);
        rect.setAttribute("height", height);
        rect.setAttribute("fill", "white");
        rect.setAttribute("stroke", "black");
        rect.setAttribute("stroke-width", "2");
        group.appendChild(rect);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", width / 2);
        text.setAttribute("y", height / 2);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("font-size", "20");

        if (isNot) {
            text.textContent = "1";
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", width + 5);
            circle.setAttribute("cy", height / 2);
            circle.setAttribute("r", 5);
            circle.setAttribute("fill", "white");
            circle.setAttribute("stroke", "black");
            circle.setAttribute("stroke-width", "2");
            group.appendChild(circle);
        } else if (node.op === '&') {
            text.textContent = "&";
        } else if (node.op === '|') {
            text.textContent = "≥1";
        }
        group.appendChild(text);
    }
    g.appendChild(group);
}

function connect(g, fromNode, toNode, index) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    // fromNode is the parent gate, toNode is the child gate/variable
    // The line goes from the output of toNode to an input of fromNode

    // Calculate the output point of the child (toNode)
    let toX, toY;
    toY = toNode.y;
    if (toNode.type === 'variable') {
        toX = toNode.x; // Simplified for variables
    } else {
        const isNot = toNode.op === '!';
        const width = isNot ? NOT_GATE_SIZE : GATE_WIDTH;
        toX = toNode.x + width;
        if (isNot) {
            toX += 10; // Account for negation circle radius and gap
        }
    }

    // Calculate the input point on the parent (fromNode)
    const totalChildren = fromNode.children.length;
    const fromX = fromNode.x;
    const fromHeight = fromNode.op === '!' ? NOT_GATE_SIZE : GATE_HEIGHT;
    let fromY = fromNode.y;

    if (totalChildren > 1) {
        const halfHeight = fromHeight / 2;
        const availableSpace = halfHeight * 0.9; // Use 90% of the half-height for pins
        const spacing = (totalChildren > 1) ? (availableSpace * 2) / (totalChildren - 1) : 0;
        const startY = fromNode.y - availableSpace;
        fromY = startY + (index * spacing);
    }

    const midX = fromX - 40;

    path.setAttribute("d", `M ${fromX},${fromY} H ${midX} V ${toY} H ${toX}`);

    path.setAttribute("stroke", "black");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    g.insertBefore(path, g.firstChild);
}

// ----------------- Expression Factoring -----------------

function factorAst(node, maxInputs) {
    if (!node || node.type !== 'operator' || !node.children) {
        return node;
    }

    // Factor children first
    node.children = node.children.map(child => factorAst(child, maxInputs));

    // If this node has too many inputs, group them
    if (node.children.length > maxInputs) {
        const op = node.op;
        let groups = [];
        for (let i = 0; i < node.children.length; i += maxInputs) {
            groups.push(node.children.slice(i, i + maxInputs));
        }

        let newChildren = groups.map(group => {
            if (group.length === 1) return group[0];
            return { type: 'operator', op: op, children: group };
        });

        // If we created multiple groups, we need to group them again
        if (newChildren.length > 1) {
            return factorAst({ type: 'operator', op: op, children: newChildren }, maxInputs);
        } else {
            return newChildren[0];
        }
    }

    return node;
}
