import { layoutState } from "../state.js";
import { $ } from "../utils/utils.js";

function resetGridStyles() {
  const cardGrid = document.querySelector("#card-grid");
  if (!cardGrid) return;

  const gridClasses = cardGrid.className.split(' ').filter(c => c.startsWith('lg:grid-cols-'));
  cardGrid.classList.remove(...gridClasses);

  const viewToggleMappings = layoutState.viewToggleMappings;
  const spanClasses = [
    "lg:row-span-1", "lg:row-span-2", "lg:row-span-3", "lg:row-span-4",
    "lg:col-span-1", "lg:col-span-2", "lg:col-span-3", "lg:col-span-4",
  ];
  Object.values(viewToggleMappings).forEach((mapping) => {
    const el = $(mapping.id);
    if (el) {
      el.classList.remove(...spanClasses);
    }
  });
}

export function updateGridCols() {
  const { viewToggleMappings, isLandscape } = layoutState;
  const cardGrid = document.querySelector("#card-grid");
  if (!cardGrid) return;

  resetGridStyles();

  const activeCards = Object.values(viewToggleMappings)
    .filter(mapping => $(mapping.id)?.style.display !== "none")
    .map(mapping => $(mapping.id));

  if (activeCards.length === 0) return;

  const muxCard = $('muxCard');
  const logicGateCard = $('logicGateCard');
  const isMuxActive = muxCard?.style.display !== 'none';
  const isLogicGateActive = logicGateCard?.style.display !== 'none';

  let totalSpan = activeCards.length;
  if (isMuxActive) {
      muxCard.classList.add('lg:col-span-2');
      totalSpan += 1;
  }
  if (isLogicGateActive) {
      logicGateCard.classList.add('lg:col-span-2');
      totalSpan += 1;
  }

  // Determine the number of columns for the grid
  let gridCols = 3;
  if (totalSpan <= 4) {
      gridCols = totalSpan;
  } else if (totalSpan === 5) {
      gridCols = 3;
  } else if (totalSpan === 6) {
      gridCols = 3;
  } else if (totalSpan > 6) {
      gridCols = 4;
  }

  // Prevent setting grid-cols-0
  if (gridCols > 0) {
    cardGrid.classList.add(`lg:grid-cols-${gridCols}`);
  }
}
