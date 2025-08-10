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

    const totalWidth = (max_level + 1) * LEVEL_SEPARATION + PADDING * 2;
    const totalHeight = y_pos + PADDING;

    svg.setAttribute("width", "100%");
    svg.setAttribute("height", totalHeight);
    svg.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);

    // Reverse x-coordinates for left-to-right layout
    reverseLayout(ast, max_level, totalWidth);

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

    layout(node.left, level + 1);
    if (node.right) {
        layout(node.right, level + 1);
        node.y = (node.left.y + node.right.y) / 2;
    } else { // NOT gate
        node.y = node.left.y;
    }
}

function reverseLayout(node, max_level, totalWidth) {
    if (!node) return;
    node.x = (max_level - node.level) * LEVEL_SEPARATION + PADDING;
    reverseLayout(node.left, max_level, totalWidth);
    reverseLayout(node.right, max_level, totalWidth);
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

const GATE_PATHS = {
    AND: "M0,0 H30 C45,0 45,40 30,40 H0 Z",
    OR: "M0,5 C5,5 25,0 40,0 C60,20 60,20 40,40 C25,40 5,35 0,35 C15,30 15,10 0,5 Z",
    NOT: "M0,0 L40,20 L0,40 Z",
};

function createGate(g, node) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("transform", `translate(${node.x}, ${node.y - GATE_HEIGHT / 2})`);

    if (node.type === 'variable') {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", 0);
        text.setAttribute("y", GATE_HEIGHT / 2);
        text.setAttribute("text-anchor", "start");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("font-size", "20");
        text.textContent = node.name;
        group.appendChild(text);
    } else {
        const gateType = node.op === '&' ? 'AND' : (node.op === '|' ? 'OR' : 'NOT');
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", GATE_PATHS[gateType]);
        path.setAttribute("fill", "white");
        path.setAttribute("stroke", "black");
        path.setAttribute("stroke-width", "2");

        group.appendChild(path);

        if (node.op === '!') {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", 45);
            circle.setAttribute("cy", 20);
            circle.setAttribute("r", 5);
            circle.setAttribute("fill", "white");
            circle.setAttribute("stroke", "black");
            circle.setAttribute("stroke-width", "2");
            group.appendChild(circle);
        }
    }
    g.appendChild(group);
}

function connect(g, fromNode, toNode, side) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    const fromX = fromNode.x;
    let fromY = fromNode.y;
    if (side === -1) fromY -= 10;
    if (side === 1) fromY += 10;

    let toX = toNode.x;
    const toY = toNode.y;

    if (toNode.type === 'variable') {
        toX += 20; // Move to the right of the variable name
    } else {
        toX += GATE_WIDTH;
        if(toNode.op === '!') toX += 10; // Extra space for NOT circle
    }

    const midX = (fromX + toX) / 2;

    path.setAttribute("d", `M ${fromX},${fromY} H ${midX} V ${toY} H ${toX}`);

    path.setAttribute("stroke", "black");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    g.insertBefore(path, g.firstChild);
}
