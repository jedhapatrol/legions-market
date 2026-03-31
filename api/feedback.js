module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category, message, figureCode, userAgent } = req.body;

  if (!category || !message || message.trim().length < 10) {
    return res.status(400).json({ error: 'Category and message (min 10 chars) are required' });
  }

  const labelMap = {
    'bug': 'bug',
    'feature': 'enhancement',
    'data': 'data-error',
    'other': 'feedback'
  };
  const label = labelMap[category] || 'feedback';

  const titlePrefix = {
    'bug': 'Bug Report',
    'feature': 'Feature Request',
    'data': 'Data Error',
    'other': 'Feedback'
  };

  const title = `[${titlePrefix[category] || 'Feedback'}] ${message.substring(0, 80)}${message.length > 80 ? '...' : ''}`;

  let body = `## ${titlePrefix[category] || 'Feedback'}\n\n${message}\n\n---\n`;
  if (figureCode) body += `**Figure:** ${figureCode}\n`;
  body += `**Source:** Legions Market feedback form\n`;
  body += `**User Agent:** ${userAgent || 'Unknown'}\n`;
  body += `**Date:** ${new Date().toISOString()}\n`;

  try {
    const response = await fetch('https://api.github.com/repos/jedhapatrol/legions-market/issues', {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_ISSUES_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        title,
        body,
        labels: [label]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('GitHub API error:', err);
      return res.status(500).json({ error: 'Failed to submit feedback' });
    }

    const issue = await response.json();
    return res.status(200).json({ success: true, issueNumber: issue.number });
  } catch (err) {
    console.error('Error creating issue:', err);
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
};
