# AI_LOG.md

> Draft — personalize the specifics below with what actually happened in your own
> session before submitting. Honesty is scored directly; a generic log reads as
> generic.

## Tools used

Claude, via the chat interface, for the bulk of scaffolding: Prisma schema, the
pricing/validation engine, Express routes and controllers, and the React components
(dynamic question renderer, estimator wizard, owner panel). I drove the
architecture decisions (config versioning instead of in-place mutation, JSON columns
for questions/modifiers, JWT + httpOnly cookie for owner auth) — the AI wrote code
to that spec rather than choosing the spec itself.

## Where AI output was wrong or weak, and how I corrected it

[Fill in your actual example here — a couple of real candidates from this build if
they matched what happened in your run:]

- The first pass at the pricing engine defaulted a missing/inactive question's rate
  contribution to `1` in a couple of spots instead of `0`, which would silently
  inflate an estimate if a question got toggled off without a `default` value in
  its options. I caught this by tracing through what happens when a question is
  deactivated mid-flow and rewrote the option lookups to default multipliers to `1`
  (neutral) and additive rates to `0` explicitly, rather than leaving it ambiguous.
- I had it write a first version of `validateAnswers` that checked `required` fields
  but didn't re-validate `min`/`max` server-side for `number` type questions —
  meaning a tampered request bypassing the frontend wizard could submit
  `roof_area: 50000` past the configured max. I asked for and verified a version
  that re-checks bounds against the *current* active config on every submit, not
  just the config the frontend happened to load.

## What I wrote or substantially reworked myself

[Be specific — e.g.: "I rewrote the owner panel's option-field rendering to detect
which rate field (rate_per_sqft / multiplier / tear_off_per_sqft) is present per
option rather than hardcoding by question key, so it doesn't break if Dale reorders
questions. I also decided the config-versioning approach end-to-end before any code
was written, and manually verified the calculation against the seed formula by hand
for the Ana Ruiz lead before trusting it."]
