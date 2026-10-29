const eventService = require('./events.service');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatShift(shift) {
  const seats = shift.capacity - shift.confirmedCount;
  const availability = seats <= 0 ? 'Full' : `${seats} seat${seats === 1 ? '' : 's'} left`;
  return `<li><strong>${escapeHtml(shift.title)}</strong> - ${escapeHtml(availability)}</li>`;
}

async function page(req, res, next) {
  try {
    const result = await eventService.getPublicPage(req.params.publicSlug);
    const title = result.state === 'not_found' ? 'Event not found' : result.event.title;
    const message = {
      published: 'Registration details will be available soon.',
      full: 'This event is currently full.',
      cancelled: 'This event has been cancelled.',
      not_found: 'The event could not be found.'
    }[result.state];
    const shifts = result.shifts?.length
      ? `<ul>${result.shifts.map(formatShift).join('')}</ul>`
      : '';

    res.type('html').send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title></head>
<body><main>
<h1>${escapeHtml(title)}</h1>
${result.event ? `<p>${escapeHtml(result.event.description || '')}</p>
<p>${escapeHtml(result.event.location || result.event.venue || '')}</p>` : ''}
<p>${escapeHtml(message)}</p>${shifts}
</main></body></html>`);
  } catch (error) {
    next(error);
  }
}

module.exports = { page };
