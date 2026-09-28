import * as migration_20260928_154142_initial from './20260928_154142_initial';
import * as migration_20260928_154235_orderable_rows from './20260928_154235_orderable_rows';
import * as migration_20260928_155352_media_prefix from './20260928_155352_media_prefix';

export const migrations = [
  {
    up: migration_20260928_154142_initial.up,
    down: migration_20260928_154142_initial.down,
    name: '20260928_154142_initial',
  },
  {
    up: migration_20260928_154235_orderable_rows.up,
    down: migration_20260928_154235_orderable_rows.down,
    name: '20260928_154235_orderable_rows',
  },
  {
    up: migration_20260928_155352_media_prefix.up,
    down: migration_20260928_155352_media_prefix.down,
    name: '20260928_155352_media_prefix'
  },
];
