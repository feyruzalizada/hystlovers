import * as migration_20260928_155402_initial from './20260928_155402_initial';
import * as migration_20260929_141316_localized_slides from './20260929_141316_localized_slides';
import * as migration_20261010_081300_localized_contact from './20261010_081300_localized_contact';

export const migrations = [
  {
    up: migration_20260928_155402_initial.up,
    down: migration_20260928_155402_initial.down,
    name: '20260928_155402_initial',
  },
  {
    up: migration_20260929_141316_localized_slides.up,
    down: migration_20260929_141316_localized_slides.down,
    name: '20260929_141316_localized_slides',
  },
  {
    up: migration_20261010_081300_localized_contact.up,
    down: migration_20261010_081300_localized_contact.down,
    name: '20261010_081300_localized_contact'
  },
];
