import { logicState, customFunctionState } from "../state.js";
import { normalizeExpression, getMinimalExpression } from "../logic/parser.js";
import {$} from "../utils/utils.js";

export function renderLogicGate() {
  const logicGateCard = document.getElementById("logicGateCard");
  if (!logicGateCard) return;

  const container = logicGateCard.querySelector(".card-body");
  if (!container) return;

  container.innerHTML = ""; // Clear previous content

  const expression = getMinimalExpression();

  if (!expression || expression === "0" || expression === "1") {
    container.innerHTML = `<div class="p-4 text-center text-gray-500">Keine Logikgatter für Konstanten darstellbar.</div>`;
    return;
  }

  const normalizedExpr = normalizeExpression(expression);

  try {
    const ast = parse(normalizedExpr);
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
    while (currentToken < tokens.length && tokens[currentToken] === '|') {
        eat('|');
        node = { type: 'operator', op: '|', left: node, right: parseAnd() };
    }
    return node;
}

function parseAnd() {
    let node = parseFactor();
    while (currentToken < tokens.length && tokens[currentToken] === '&') {
        eat('&');
        node = { type: 'operator', op: '&', left: node, right: parseFactor() };
    }
    return node;
}

function parseFactor() {
    const token = tokens[currentToken];
    if (token === '!') {
        eat('!');
        return { type: 'operator', op: '!', left: parseFactor(), right: null };
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

    const height = node.op === '!' ? NOT_GATE_SIZE : GATE_HEIGHT;

    if (node.type === 'variable') {
        node.y = y_pos;
        y_pos += height + SIBLING_SEPARATION;
        return;
    }

    layout(node.left, level + 1);
    if (node.right) {
        layout(node.right, level + 1);
        node.y = (node.left.y + node.right.y) / 2;
    } else { // NOT gate
        node.y = node.left.y;
    }
}

function reverseLayout(node, max_level) {
    if (!node) return;
    node.x = (max_level - node.level) * LEVEL_SEPARATION + PADDING;
    reverseLayout(node.left, max_level);
    reverseLayout(node.right, max_level);
}


function draw(g, node) {
    if (!node) return;

    createGate(g, node);

    if (node.left) {
        connect(g, node, node.left, node.right ? -1 : 0);
        draw(g, node.left);
    }
    if (node.right) {
        connect(g, node, node.right, 1);
        draw(g, node.right);
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

function connect(g, fromNode, toNode, side) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    // --- Calculate connection points ---
    const fromIsTopInput = side === -1;
    const fromIsBottomInput = side === 1;
    const fromIsSingleInput = side === 0;

    const fromHeight = fromNode.op === '!' ? NOT_GATE_SIZE : GATE_HEIGHT;
    const fromX = fromNode.x;
    let fromY = fromNode.y;

    if (fromIsTopInput) fromY -= fromHeight / 4;
    if (fromIsBottomInput) fromY += fromHeight / 4;

    let toX;
    const toY = toNode.y;
    const toIsVariable = toNode.type === 'variable';
    const toIsNot = toNode.op === '!';
    const toWidth = toIsNot ? NOT_GATE_SIZE : GATE_WIDTH;

    if (toIsVariable) {
        // Estimate variable text width (simple approximation)
        toX = toNode.x + toNode.name.length * 10;
    } else {
        toX = toNode.x + toWidth;
        if (toIsNot) {
            toX += 10; // Account for negation circle
        }
    }

    const midX = (fromX + toX) / 2;

    path.setAttribute("d", `M ${fromX},${fromY} H ${midX} V ${toY} H ${toX}`);

    path.setAttribute("stroke", "black");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    g.insertBefore(path, g.firstChild);
}
