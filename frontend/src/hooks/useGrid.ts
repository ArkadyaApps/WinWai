import { useWindowDimensions } from 'react-native';

export const CARD_MARGIN = 8;
const MAX_CONTENT_WIDTH = 1000;

/**
 * Responsive card grid: 3 columns on phones (as before), more on wider
 * screens, with the grid capped and centred so cards don't stretch across a
 * desktop monitor. Recomputed on resize/rotation.
 */
export function useGrid() {
  const { width } = useWindowDimensions();
  const containerWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const columns = containerWidth >= 900 ? 5 : containerWidth >= 600 ? 4 : 3;
  const cardWidth = (containerWidth - CARD_MARGIN * (columns + 1)) / columns;
  return { columns, cardWidth, containerWidth };
}
