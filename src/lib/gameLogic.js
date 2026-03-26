export const DIR = { RIGHT: 0, DOWN: 1, LEFT: 2, UP: 3 };
export const DIR_DELTA = {
  [DIR.RIGHT]: [1, 0],
  [DIR.DOWN]: [0, 1],
  [DIR.LEFT]: [-1, 0],
  [DIR.UP]: [0, -1],
};
export const DIR_ANGLE = { [DIR.RIGHT]: 0, [DIR.DOWN]: 90, [DIR.LEFT]: 180, [DIR.UP]: 270 };

export const BLOCK_TYPES = [
  { id: 'FORWARD',     label: '▲ Вперёд',   color: '#3b82f6', emoji: '⬆️' },
  { id: 'TURN_LEFT',   label: '↰ Налево',   color: '#8b5cf6', emoji: '↰' },
  { id: 'TURN_RIGHT',  label: '↱ Направо',  color: '#ec4899', emoji: '↱' },
];

export const DRINKS = [
  { id: 'coffee',  label: 'Кофе ☕',       icon: '☕' },
  { id: 'tea',     label: 'Чай 🍵',        icon: '🍵' },
  { id: 'juice',   label: 'Сок 🍊',        icon: '🍊' },
  { id: 'water',   label: 'Вода 💧',       icon: '💧' },
];

export const LEVELS = [
  {
    id: 1,
    title: 'Уровень 1',
    hint: 'Робот едет прямо — расчисти снег по всей дорожке!',
    grid: { cols: 5, rows: 3 },
    snow: [[0,1],[1,1],[2,1],[3,1],[4,1]],
    robot: { col: 0, row: 1, dir: DIR.RIGHT },
    maxBlocks: 6,
  },
  {
    id: 2,
    title: 'Уровень 2',
    hint: 'Снег лежит змейкой — не запутайся в поворотах!',
    grid: { cols: 5, rows: 4 },
    snow: [[0,0],[1,0],[2,0],[3,0],[3,1],[3,2],[2,2],[1,2],[0,2],[0,3],[1,3],[2,3]],
    robot: { col: 0, row: 0, dir: DIR.RIGHT },
    maxBlocks: 16,
  },
];

export function executeProgram(level, blocks) {
  const state = { ...level.robot };
  const cleared = new Set(level.snow.map(([c, r]) => `${c},${r}`));
  cleared.delete(`${state.col},${state.row}`);

  const steps = [{ col: state.col, row: state.row, dir: state.dir, cleared: new Set(level.snow.map(([c,r]) => `${c},${r}`)) }];
  const firstCleared = new Set(steps[0].cleared);
  firstCleared.delete(`${state.col},${state.row}`);
  steps[0] = { ...steps[0], cleared: firstCleared };

  let error = null;

  for (const block of blocks) {
    if (block.type === 'FORWARD') {
      const [dc, dr] = DIR_DELTA[state.dir];
      const nc = state.col + dc;
      const nr = state.row + dr;
      if (nc < 0 || nr < 0 || nc >= level.grid.cols || nr >= level.grid.rows) {
        error = 'Робот выехал за пределы поля!';
        break;
      }
      state.col = nc;
      state.row = nr;
    } else if (block.type === 'TURN_LEFT') {
      state.dir = (state.dir + 3) % 4;
    } else if (block.type === 'TURN_RIGHT') {
      state.dir = (state.dir + 1) % 4;
    }
    cleared.delete(`${state.col},${state.row}`);
    steps.push({ col: state.col, row: state.row, dir: state.dir, cleared: new Set(cleared) });
  }

  const success = !error && cleared.size === 0;
  return { steps, success, error };
}
