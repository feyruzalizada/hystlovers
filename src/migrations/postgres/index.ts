import * as migration_20260928_155402_initial from './20260928_155402_initial';
import * as migration_20260929_141316_localized_slides from './20260929_141316_localized_slides';
import * as migration_20261010_081300_localized_contact from './20261010_081300_localized_contact';
import * as migration_20261017_151442_brand_block from './20261017_151442_brand_block';
import * as migration_20261019_195237_localized_item from './20261019_195237_localized_item';
import * as migration_20261019_200605_brand_announcement from './20261019_200605_brand_announcement';
import * as migration_20261028_100649_customer_admin_fields from './20261028_100649_customer_admin_fields';
import * as migration_20261029_171422_filter_colors from './20261029_171422_filter_colors';
import * as migration_20261029_215511_filter_fabrics from './20261029_215511_filter_fabrics';
import * as migration_20261029_225437_admin_parity_forms from './20261029_225437_admin_parity_forms';

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
    name: '20261010_081300_localized_contact',
  },
  {
    up: migration_20261017_151442_brand_block.up,
    down: migration_20261017_151442_brand_block.down,
    name: '20261017_151442_brand_block',
  },
  {
    up: migration_20261019_195237_localized_item.up,
    down: migration_20261019_195237_localized_item.down,
    name: '20261019_195237_localized_item',
  },
  {
    up: migration_20261019_200605_brand_announcement.up,
    down: migration_20261019_200605_brand_announcement.down,
    name: '20261019_200605_brand_announcement',
  },
  {
    up: migration_20261028_100649_customer_admin_fields.up,
    down: migration_20261028_100649_customer_admin_fields.down,
    name: '20261028_100649_customer_admin_fields',
  },
  {
    up: migration_20261029_171422_filter_colors.up,
    down: migration_20261029_171422_filter_colors.down,
    name: '20261029_171422_filter_colors',
  },
  {
    up: migration_20261029_215511_filter_fabrics.up,
    down: migration_20261029_215511_filter_fabrics.down,
    name: '20261029_215511_filter_fabrics',
  },
  {
    up: migration_20261029_225437_admin_parity_forms.up,
    down: migration_20261029_225437_admin_parity_forms.down,
    name: '20261029_225437_admin_parity_forms'
  },
];
