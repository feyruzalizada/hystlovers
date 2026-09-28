import * as migration_20260928_155402_initial from './20260928_155402_initial';

export const migrations = [
  {
    up: migration_20260928_155402_initial.up,
    down: migration_20260928_155402_initial.down,
    name: '20260928_155402_initial'
  },
];
