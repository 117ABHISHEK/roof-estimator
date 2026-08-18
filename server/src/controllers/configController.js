import { prisma } from '../config/db.js';

async function getActiveConfig() {
  return prisma.config.findFirst({ where: { active: true }, orderBy: { config_version: 'desc' } });
}

// GET /api/config — public. Only active questions, sorted, no internal
// metadata beyond what the estimator needs to render + validate.
export async function getPublicConfig(req, res) {
  const config = await getActiveConfig();
  if (!config) return res.status(503).json({ error: 'No active configuration found.' });

  const activeQuestions = (config.questions || [])
    .filter((q) => q.active)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  res.json({
    config_version: config.config_version,
    business: config.business,
    questions: activeQuestions
  });
}

// GET /api/admin/config — owner panel editor needs to see EVERY question
// (including inactive ones, so they can be toggled back on) plus modifiers.
export async function getAdminConfig(req, res) {
  const config = await getActiveConfig();
  if (!config) return res.status(503).json({ error: 'No active configuration found.' });
  res.json(config);
}

// PUT /api/admin/config — Dale/Marcus save changes. We never mutate the
// active row; we insert config_version + 1 and flip active. This means a
// homeowner already mid-estimate on the old config keeps a consistent
// question set for their session (their answers were validated against
// what they were shown), while any NEW page load immediately gets the
// updated config. See DECISIONS.md.
export async function updateConfig(req, res) {
  const { business, questions, modifiers } = req.body || {};

  if (!Array.isArray(questions) || typeof modifiers !== 'object' || modifiers === null) {
    return res.status(400).json({ error: 'questions[] and modifiers{} are required.' });
  }

  const current = await getActiveConfig();
  const nextVersion = (current?.config_version ?? 0) + 1;

  const result = await prisma.$transaction(async (tx) => {
    if (current) {
      await tx.config.update({ where: { id: current.id }, data: { active: false } });
    }
    return tx.config.create({
      data: {
        config_version: nextVersion,
        active: true,
        business: business ?? current?.business ?? {},
        questions,
        modifiers
      }
    });
  });

  res.json(result);
}

// GET /api/admin/config/history — stretch goal: version history list.
export async function getConfigHistory(req, res) {
  const versions = await prisma.config.findMany({
    orderBy: { config_version: 'desc' },
    select: { config_version: true, active: true, created_at: true, business: true }
  });
  res.json(versions);
}
