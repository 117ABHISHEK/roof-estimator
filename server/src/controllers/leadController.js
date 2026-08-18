import { prisma } from '../config/db.js';
import { validateAnswers, calculateEstimate, EstimateValidationError } from '../services/calculator.js';

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/estimate — public. Validates contact + answers, computes the
// estimate server-side against whatever config is active RIGHT NOW, and
// persists the lead tagged with that config_version so it's always
// traceable to the exact rates that produced it.
export async function submitEstimate(req, res) {
  const { name, phone, email, answers } = req.body || {};

  const contactErrors = {};
  if (!name || typeof name !== 'string' || !name.trim()) contactErrors.name = 'Name is required.';
  if (!phone || typeof phone !== 'string' || !phone.trim()) contactErrors.phone = 'Phone is required.';
  if (!isValidEmail(email)) contactErrors.email = 'A valid email is required.';

  if (Object.keys(contactErrors).length > 0) {
    return res.status(400).json({ error: 'Invalid contact details.', fields: contactErrors });
  }

  const config = await prisma.config.findFirst({ where: { active: true }, orderBy: { config_version: 'desc' } });
  if (!config) return res.status(503).json({ error: 'No active configuration found.' });

  try {
    validateAnswers(config, answers || {});
  } catch (err) {
    if (err instanceof EstimateValidationError) {
      return res.status(400).json({ error: 'Invalid answers.', fields: err.errors });
    }
    throw err;
  }

  const { estimate_low, estimate_high } = calculateEstimate(config, answers);

  const lead = await prisma.lead.create({
    data: {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      answers,
      estimate_low,
      estimate_high,
      config_version: config.config_version
    }
  });

  res.status(201).json({
    id: lead.id,
    estimate_low,
    estimate_high,
    currency: config.business?.currency ?? 'USD'
  });
}

// GET /api/admin/leads — owner panel table, most recent first.
export async function listLeads(req, res) {
  const leads = await prisma.lead.findMany({ orderBy: { captured_at: 'desc' } });
  res.json(leads);
}

// GET /api/admin/leads/export.csv — stretch goal.
export async function exportLeadsCsv(req, res) {
  const leads = await prisma.lead.findMany({ orderBy: { captured_at: 'desc' } });

  const header = ['id', 'name', 'phone', 'email', 'captured_at', 'config_version', 'estimate_low', 'estimate_high', 'answers'];
  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const rows = leads.map((l) =>
    [
      l.id,
      l.name,
      l.phone,
      l.email,
      l.captured_at.toISOString(),
      l.config_version,
      l.estimate_low,
      l.estimate_high,
      JSON.stringify(l.answers)
    ]
      .map(escape)
      .join(',')
  );

  const csv = [header.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
  res.send(csv);
}
