import { logicState, customFunctionState } from "../state.js";
import { normalizeExpression, getMinimalExpression } from "../logic/parser.js";
import {$} from "../utils/utils.js";

export function renderLogicGate() {
  const logicGateCard = document.getElementById("logicGateCard");
  if (!logicGateCard) return;

  const container = document.getElementById("logic-gate-container");
  if (!container) return;

  container.innerHTML = "";

  const expression = getMinimalExpression();

  if (!expression || expression === "0" || expression === "1") {
    container.innerHTML = `<div class="p-4 text-center text-gray-500">Keine Logikgatter für Konstanten darstellbar.</div>`;
    return;
  }

  const normalizedExpr = normalizeExpression(expression);

  try {
    let ast = parse(normalizedExpr);
    const svg = renderSvg(ast);
    container.appendChild(svg);
  } catch (error) {
    console.error("Error rendering logic gate:", error);
    container.innerHTML = `<div class="p-4 text-center text-red-500">Fehler beim Darstellen des Logikgatters: ${error.message}</div>`;
  }
}

// ----------------- Parser (Binary AST) -----------------
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


// ----------------- SVG Renderer (DAG Layout) -----------------
const GATE_WIDTH = 60;
const GATE_HEIGHT = 40;
const NOT_GATE_SIZE = 40;
const LEVEL_SEPARATION = 120;
const SIBLING_SEPARATION = 40;
const PADDING = 20;

function renderSvg(ast) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(g);

    const { levels, uniqueInputs, nodeMap } = processAstForDag(ast);

    layoutDag(levels, uniqueInputs, nodeMap);

    drawDag(g, levels, uniqueInputs, nodeMap);

    const maxLevel = levels.length;
    const totalWidth = (maxLevel + 1) * LEVEL_SEPARATION + PADDING * 2;
    const yPositions = [...Object.values(uniqueInputs).map(n => n.y), ...Object.values(nodeMap).map(n => n.y)];
    const totalHeight = Math.max(0, ...yPositions) + GATE_HEIGHT + PADDING;

    svg.setAttribute("width", "100%");
    svg.setAttribute("height", totalHeight);
    svg.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);

    return svg;
}

function processAstForDag(ast) {
    const nodeMap = new Map();
    const uniqueInputs = {};
    let nodeIdCounter = 0;

    function traverse(node) {
        if (!node) return null;

        // Create a unique ID for every node to handle shared subtrees
        if (!node.hasOwnProperty('id')) {
            node.id = nodeIdCounter++;
        }

        if (nodeMap.has(node.id)) return node.id;

        nodeMap.set(node.id, node);

        if (node.type === 'variable') {
            if (!uniqueInputs[node.name]) {
                uniqueInputs[node.name] = { ...node, isUniqueInput: true, id: `input-${node.name}` };
            }
            node.uniqueInputId = `input-${node.name}`;
            node.level = 0;
            return node.id;
        }

        const leftId = traverse(node.left);
        const rightId = traverse(node.right);

        const leftNode = leftId !== null ? nodeMap.get(leftId) : null;
        const rightNode = rightId !== null ? nodeMap.get(rightId) : null;

        node.level = 1 + Math.max(leftNode ? leftNode.level : -1, rightNode ? rightNode.level : -1);

        return node.id;
    }

    traverse(ast);

    const levels = [];
    for (const node of nodeMap.values()) {
        if (node.type === 'variable') continue;
        if (!levels[node.level]) {
            levels[node.level] = [];
        }
        levels[node.level].push(node);
    }

    // Remove empty levels and shift levels to start from 0
    const compactedLevels = levels.filter(l => l && l.length > 0);
    compactedLevels.forEach((level, i) => level.forEach(node => node.level = i + 1));

    return { levels: compactedLevels, uniqueInputs, nodeMap };
}

function layoutDag(levels, uniqueInputs, nodeMap) {
    let y = PADDING;
    const sortedInputs = Object.values(uniqueInputs).sort((a, b) => a.name.localeCompare(b.name));
    for (const inputNode of sortedInputs) {
        inputNode.x = PADDING;
        inputNode.y = y;
        y += GATE_HEIGHT + SIBLING_SEPARATION;
    }

    levels.forEach((level) => {
        level.forEach(node => {
            node.x = node.level * LEVEL_SEPARATION + PADDING;

            let y_sum = 0;
            let count = 0;
            const children = [node.left, node.right].filter(c => c);

            children.forEach(child => {
                const childNode = nodeMap.get(child.id);
                if (childNode.type === 'variable') {
                    y_sum += uniqueInputs[childNode.name].y;
                } else {
                    y_sum += childNode.y;
                }
                count++;
            });
            node.y = count > 0 ? y_sum / count : PADDING;
        });

        level.sort((a, b) => a.y - b.y);
        for (let i = 1; i < level.length; i++) {
            const prev = level[i-1];
            const curr = level[i];
            const requiredY = prev.y + GATE_HEIGHT + SIBLING_SEPARATION;
            if (curr.y < requiredY) {
                curr.y = requiredY;
            }
        }
    });
}

function drawDag(g, levels, uniqueInputs, nodeMap) {
    Object.values(uniqueInputs).forEach(node => createGate(g, node));
    levels.forEach(level => level.forEach(node => createGate(g, node)));

    levels.forEach(level => {
        level.forEach(parentNode => {
            const children = [parentNode.left, parentNode.right].filter(c => c);
            children.forEach((child, index) => {
                const childNode = nodeMap.get(child.id);
                const sourceNode = childNode.isUniqueInput ? uniqueInputs[childNode.name] : childNode;
                connect(g, parentNode, sourceNode, index, children.length);
            });
        });
    });
}

function createGate(g, node) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const isNot = node.op === '!';
    const width = isNot ? NOT_GATE_SIZE : GATE_WIDTH;
    const height = isNot ? NOT_GATE_SIZE : GATE_HEIGHT;

    group.setAttribute("transform", `translate(${node.x}, ${node.y - height / 2})`);

    if (node.isUniqueInput) {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", 0);
        text.setAttribute("y", height / 2);
        text.setAttribute("text-anchor", "start");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("font-size", "20");
        text.textContent = node.name;
        group.appendChild(text);
    } else { // It's a gate
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

function connect(g, parentNode, childNode, index, totalChildren) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    // Output point of the childNode
    let fromX, fromY;
    fromY = childNode.y;
    if (childNode.isUniqueInput) {
        fromX = childNode.x + childNode.name.length * 10; // Approx width of text
    } else {
        const isNot = childNode.op === '!';
        const width = isNot ? NOT_GATE_SIZE : GATE_WIDTH;
        fromX = childNode.x + width;
        if (isNot) {
            fromX += 10;
        }
    }

    // Input point on the parentNode
    const toX = parentNode.x;
    const toHeight = parentNode.op === '!' ? NOT_GATE_SIZE : GATE_HEIGHT;
    let toY = parentNode.y;
    if (totalChildren > 1) {
        const halfHeight = toHeight / 2;
        const availableSpace = halfHeight * 0.9;
        const spacing = (totalChildren > 1) ? (availableSpace * 2) / (totalChildren - 1) : 0;
        const startY = parentNode.y - availableSpace;
        toY = startY + (index * spacing);
    }

    const midX = fromX + LEVEL_SEPARATION / 2;

    path.setAttribute("d", `M ${fromX},${fromY} H ${midX} V ${toY} H ${toX}`);

    path.setAttribute("stroke", "black");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    g.insertBefore(path, g.firstChild);
}
