import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// The seed export had "multiplier: 1.12" as a STRING on the medium pitch
// option. We normalize every numeric field to a real Number here so the
// calculation engine never has to defensively parse strings at request
// time — normalization happens once, at data-entry, not on every request.
const CONFIG_V3 = {
  config_version: 3,
  active: true,
  business: { name: 'Northline Roofing & Exteriors', region: 'Columbus, OH', currency: 'USD' },
  questions: [
    {
      key: 'roof_area',
      label: 'Roughly how big is your roof?',
      type: 'number',
      unit: 'sq ft',
      required: true,
      min: 300,
      max: 12000,
      active: true,
      order: 1
    },
    {
      key: 'material',
      label: 'What material do you want?',
      type: 'select',
      required: true,
      active: true,
      order: 2,
      options: [
        { value: 'asphalt_3tab', label: 'Asphalt shingle - 3-tab', rate_per_sqft: 4.25 },
        { value: 'asphalt_arch', label: 'Asphalt shingle - architectural', rate_per_sqft: 5.9 },
        { value: 'metal_standing', label: 'Standing seam metal', rate_per_sqft: 12.4 },
        { value: 'cedar_shake', label: 'Cedar shake', rate_per_sqft: 11.1 }
      ]
    },
    {
      key: 'pitch',
      label: 'How steep is the roof?',
      type: 'select',
      required: true,
      active: true,
      order: 3,
      options: [
        { value: 'low', label: 'Low - you could walk on it', multiplier: 1.0 },
        { value: 'medium', label: 'Medium', multiplier: 1.12 }, // normalized from "1.12"
        { value: 'steep', label: 'Steep - not walkable', multiplier: 1.3 }
      ]
    },
    {
      key: 'layers',
      label: 'How many layers of old roofing are on there now?',
      type: 'select',
      required: true,
      active: true,
      order: 4,
      options: [
        { value: '0', label: 'None - new build', tear_off_per_sqft: 0 },
        { value: '1', label: 'One layer', tear_off_per_sqft: 1.15 },
        { value: '2', label: 'Two or more layers', tear_off_per_sqft: 2.05 }
      ]
    },
    {
      key: 'stories',
      label: 'How many stories is the house?',
      type: 'select',
      required: true,
      active: true,
      order: 5,
      options: [
        { value: '1', label: 'Single storey', multiplier: 1.0 },
        { value: '2', label: 'Two storeys', multiplier: 1.08 },
        { value: '3', label: 'Three or more', multiplier: 1.18 }
      ]
    }
  ],
  modifiers: { waste_factor: 0.1, permit_flat_fee: 350, range_spread_pct: 12 }
};

// ld_0917 references config_version 1, which we were never given (only the
// v3 export). Our Lead.config_version has a foreign-key constraint, so we
// seed a minimal, INACTIVE v1 placeholder purely to satisfy referential
// integrity for that historical row. It is never served by /api/config and
// can't be edited from the owner panel. See DECISIONS.md.
const CONFIG_V1_PLACEHOLDER = {
  config_version: 1,
  active: false,
  business: { name: 'Northline Roofing & Exteriors', region: 'Columbus, OH', currency: 'USD' },
  questions: [],
  modifiers: { waste_factor: 0.1, permit_flat_fee: 350, range_spread_pct: 12 }
};

const LEADS = [
  {
    name: 'Ana Ruiz',
    phone: '+1-614-555-0148',
    email: 'aruiz@example.com',
    answers: { roof_area: 2100, material: 'asphalt_arch', pitch: 'medium', layers: '1', stories: '2' },
    estimate_low: 21480,
    estimate_high: 27260,
    config_version: 3,
    captured_at: new Date('2026-06-02T14:20:11Z')
  },
  {
    // Legacy shape: different question set entirely (chimney_count,
    // gutter_replace, a "slate_natural" material that no longer exists
    // in any config we hold). We store it as-is — answers is a free-form
    // JSON blob precisely so historical leads never need to be migrated
    // or dropped when the question set changes.
    name: 'Bill Tanner',
    phone: '+1-614-555-0192',
    email: 'btanner@example.com',
    answers: { roof_area: 1450, material: 'slate_natural', pitch: 'steep', chimney_count: 2, gutter_replace: 'yes' },
    estimate_low: 38900,
    estimate_high: 44100,
    config_version: 1,
    captured_at: new Date('2026-03-18T09:02:44Z')
  },
  {
    name: 'Priya Nair',
    phone: '+1-614-555-0177',
    email: 'pnair@example.com',
    answers: { roof_area: 900, material: 'metal_standing', pitch: 'low', layers: '0', stories: '1' },
    estimate_low: 12240,
    estimate_high: 15530,
    config_version: 3,
    captured_at: new Date('2026-07-11T18:47:03Z')
  }
];

async function main() {
  console.log('Seeding...');

  await prisma.config.upsert({
    where: { config_version: 1 },
    update: {},
    create: CONFIG_V1_PLACEHOLDER
  });

  await prisma.config.upsert({
    where: { config_version: 3 },
    update: {},
    create: CONFIG_V3
  });

  for (const lead of LEADS) {
    await prisma.lead.create({ data: lead });
  }

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'roofing2026!';
  const password_hash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { username },
    update: { password_hash },
    create: { username, password_hash }
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
