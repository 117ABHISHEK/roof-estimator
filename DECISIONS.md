# DECISIONS.md

## Stack

React (Vite) + Tailwind on the front, Express on the back, PostgreSQL via Prisma for
persistence. I picked Postgres over Mongo even though Config is really a
document — Leads benefit from a real foreign key to `config_version` (referential
integrity: you can't record a lead against a config version that doesn't exist), and
Prisma migrations give a clean upgrade path if this ever needs relational lead data
(e.g. per-lead status, assigned rep) later. `Config.questions` and `Config.modifiers`
stay as JSON columns — that data is genuinely schema-flexible (Dale might add a
question with fields I haven't anticipated) and forcing it into normalized tables
would fight the brief's own requirement that questions be freely editable.

## The formula, in plain language

For a given roof: take the square footage, multiply by the material's rate per
square foot, add 10% on top for wasted material. Add the cost of tearing off any
old layers (also priced per square foot). Multiply that whole subtotal by a steepness
multiplier and a stories multiplier — steeper and taller roofs cost more to work on
regardless of material. Add a flat $350 permit fee. That total is the midpoint. The
low and high ends of the range are that midpoint minus/plus 12%, because nobody gets
an exact price without an inspection.

## Versioning instead of mutation

The owner panel does not edit the active config row in place. Saving writes a brand
new `Config` row at `config_version + 1` and flips `active` on it. I chose this over
in-place mutation for two reasons: it gives Dale free version history (a stretch
goal) essentially for free, and it means a homeowner who's mid-estimate when Marcus
saves a price change isn't affected — their form was rendered from a specific
version's questions, and if they submit slightly after a save, `/api/estimate`
simply re-reads whatever is active at submit time and prices against that. There's
no half-updated state visible to anyone.

## What I deliberately did not build

- **Per-user owner accounts.** Dale and Marcus share one login. The brief says "it
  can't be something where you need to be technical to use it" — it doesn't ask for
  audit trails on who changed what. Real user accounts, roles, and permissions felt
  like scope creep for a 24-hour build and would cost hours better spent on the
  calculation correctness and UX polish that are actually being scored.
- **Adding entirely new questions from the panel** (stretch goal, explicitly marked
  optional). Editing existing questions and toggling them on/off covers Dale's
  stated need ("drop one people get confused by"). Letting him invent a new question
  type from scratch touches the calculation engine's assumptions about which keys
  exist, and I'd rather ship that carefully later than rush it now.
- **Multi-tenancy.** One business, one config lineage. Nothing in the brief
  suggests Wantace needs this to serve multiple roofing companies from one deploy.

## Seed data oddities and how I handled them

- `pitch.medium.multiplier` arrived as the string `"1.12"` instead of a number.
  Normalized once at seed time so the calculation engine never has to defensively
  `Number()`-coerce config values pulled from the DB — it trusts what's stored.
- The `ld_0917` (Bill Tanner) lead references `config_version: 1`, which was never
  given to me — I only have the v3 export. Since `Lead.config_version` is a real
  foreign key, I seeded a minimal, inactive v1 placeholder row purely to satisfy
  that constraint; it's never served by the public API or editable from the panel.
  Bill's `answers` blob also has a completely different shape (`chimney_count`,
  `gutter_replace`, a `slate_natural` material that doesn't exist in any config I
  hold) — I stored it as-is. `answers` is a free-form JSON field specifically so
  historical leads never need to be back-migrated when the question set evolves.
- The seed leads' `estimate_low`/`estimate_high` don't necessarily match what my
  formula would produce for those same answers, since the brief explicitly says not
  to assume the formula must reproduce them. I left the historical figures untouched
  — they're a record of what was actually quoted, not something my new engine should
  overwrite.

## Questions I'd ask Dale before a real launch

1. Is the 12% spread the same for every material, or should custom/rare materials
   (cedar shake, metal) carry a wider range given more quote variance in practice?
2. Who besides Marcus needs panel access, and does he want a heads-up (email/SMS)
   the moment a lead comes in, or is checking the panel daily enough?
3. Does he want leads that don't convert marked somehow, or is "list of everyone who
   filled it out" sufficient forever?
4. Any regulatory requirement in Ohio around disclosing that this is an estimate,
   not a binding quote, more prominently than my current one-line disclaimer?

## With another week

Config version history UI (view/diff/rollback past versions — the data model already
supports it, just needs a screen), a real audit log of who changed what, webhook
delivery for new leads, basic rate-limiting on `/api/estimate` to stop bot spam
skewing the leads table, and automated tests around the calculator's edge cases
(zero roof area, every option inactive, decimal roof area).
