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

  const activeCount = activeCards.length;

  if (activeCount === 0) return;

  const isMuxActive = !!activeCards.find(card => card.id === 'muxCard');
  const isLogicGateActive = !!activeCards.find(card => card.id === 'logicGateCard');
  const muxCard = $('muxCard');
  const logicGateCard = $('logicGateCard');

  let gridCols = 3; // Default to 3 columns for lg screens

  if (activeCount === 1) {
    gridCols = 1;
  } else if (activeCount === 2) {
    gridCols = 2;
  } else if (activeCount === 4) {
    gridCols = 2;
  } else {
    gridCols = 3;
  }

  cardGrid.classList.add(`lg:grid-cols-${gridCols}`);

  if (activeCount === 3) {
    if (isMuxActive) muxCard.classList.add('lg:col-span-2');
    else if (isLogicGateActive) logicGateCard.classList.add('lg:col-span-2');
  } else if (activeCount === 5) {
    if (isMuxActive && isLogicGateActive) {
        muxCard.classList.add('lg:col-span-2');
        logicGateCard.classList.add('lg:col-span-2');
    } else if (isMuxActive) {
        muxCard.classList.add('lg:col-span-2');
    } else if (isLogicGateActive) {
        logicGateCard.classList.add('lg:col-span-2');
    }
  }
}
