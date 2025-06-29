import { renderSymmetryDiagram } from './ui.js';







document.getElementById("renderButton").addEventListener("click", () => {
    const numberOfVariables = parseInt(document.getElementById("numberOfVariables").value, 10);
    const randomTruthTable = Array.from({ length: 2 ** numberOfVariables }, () => (Math.random() < 0.5 ? 0 : 1));
    
    try {
        renderSymmetryDiagram(numberOfVariables, randomTruthTable);
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});



