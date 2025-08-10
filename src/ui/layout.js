import { layoutState } from "../state.js";
import { $ } from "../utils/utils.js";

function resetGridStyles() {
  const cardGrid = document.querySelector("#card-grid");
  if (!cardGrid) return;

  // Remove all grid-related classes
  const classesToRemove = cardGrid.className.split(' ').filter(c => c.startsWith('lg:grid-cols-'));
  cardGrid.classList.remove(...classesToRemove);

  // Reset span classes on all cards
  const viewToggleMappings = layoutState.viewToggleMappings;
  const spanClassesToRemove = [
    "lg:row-span-1", "lg:row-span-2", "lg:row-span-3", "lg:row-span-4",
    "lg:col-span-1", "lg:col-span-2", "lg:col-span-3", "lg:col-span-4",
  ];
  Object.values(viewToggleMappings).forEach((mapping) => {
    const el = $(mapping.id);
    if (el) {
      el.classList.remove(...spanClassesToRemove);
    }
  });
}

export function updateGridCols() {
  const { viewToggleMappings, isLandscape } = layoutState;
  const cardGrid = document.querySelector("#card-grid");
  if (!cardGrid) return;

  resetGridStyles();

  const activeCards = Object.values(viewToggleMappings)
    .filter(mapping => $(mapping.id)?.style.display !== "none");

  const activeCount = activeCards.length;

  if (activeCount === 0) {
    return;
  }

  let gridColsClass = `lg:grid-cols-1`;

  if (isLandscape) {
    // In landscape, use a more horizontal layout
    if (activeCount <= 3) {
      gridColsClass = `lg:grid-cols-${activeCount}`;
    } else if (activeCount === 4) {
      gridColsClass = 'lg:grid-cols-4';
    } else if (activeCount === 5) {
      gridColsClass = 'lg:grid-cols-3'; // 3 on top, 2 below
    } else if (activeCount >= 6) {
      gridColsClass = 'lg:grid-cols-3'; // 3x2 grid
    }
  } else {
    // In portrait, use a more vertical layout
    if (activeCount === 1) {
      gridColsClass = 'lg:grid-cols-1';
    } else if (activeCount <= 3) {
        gridColsClass = 'lg:grid-cols-1';
    } else if (activeCount === 4) {
      gridColsClass = 'lg:grid-cols-2'; // 2x2 grid
    } else if (activeCount >= 5) {
      gridColsClass = 'lg:grid-cols-3'; // 3xN grid
    }
  }

  cardGrid.classList.add(gridColsClass);

  // Special handling for 5 cards in landscape to make it look better
  if (isLandscape && activeCount === 5) {
      const truthCard = $(viewToggleMappings.toggleTruthTable.id);
      if(truthCard && truthCard.style.display !== 'none') {
        truthCard.classList.add('lg:col-span-3');
      }
  }
   // Special handling for 6 cards in landscape to make it look better
  if (isLandscape && activeCount === 6) {
    const truthCard = $(viewToggleMappings.toggleTruthTable.id);
    if(truthCard && truthCard.style.display !== 'none') {
      truthCard.classList.add('lg:col-span-3');
    }
}
}
