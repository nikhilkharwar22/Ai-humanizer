const crypto = require('crypto');

const MODES = {
  light: {
    temperature: 0.4,
    maxTokensMultiplier: 1.2,
    instructions:
      'Apply minor natural edits, fix grammar, and keep structure very close to original.',
  },
  standard: {
    temperature: 0.7,
    maxTokensMultiplier: 1.4,
    instructions:
      'Rewrite in a natural conversational tone with sentence restructuring and better flow.',
  },
  advanced: {
    temperature: 0.9,
    maxTokensMultiplier: 1.6,
    instructions:
      'Deeply humanize with varied rhythm and storytelling style while preserving exact meaning.',
  },
};

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function validateMode(mode = 'standard') {
  return MODES[mode] ? mode : 'standard';
}

function countWords(text = '') {
  return (text.trim().match(/\S+/g) || []).length;
}

function preserveParagraphs(original, rewritten) {
  const originalParas = original.split(/\n{2,}/);
  const rewrittenParas = rewritten.split(/\n{2,}/);

  if (originalParas.length === rewrittenParas.length) {
    return rewrittenParas.map((p) => p.trim()).join('\n\n');
  }

  return rewritten
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n\n');
}

function fallbackHumanize(text, mode) {
  const contractions = [
    [/\bit is\b/gi, "it's"],
    [/\bdo not\b/gi, "don't"],
    [/\bcannot\b/gi, "can't"],
    [/\bwill not\b/gi, "won't"],
    [/\bthey are\b/gi, "they're"],
    [/\bwe are\b/gi, "we're"],
    [/\byou are\b/gi, "you're"],
  ];

  let output = text;

  contractions.forEach(([pattern, replacement]) => {
    output = output.replace(pattern, replacement);
  });

  output = output
    .replace(/\bmoreover\b/gi, 'on top of that')
    .replace(/\btherefore\b/gi, 'so')
    .replace(/\bin addition\b/gi, 'also')
    .replace(/\bit is important to note that\b/gi, "it's worth noting that");

  if (mode !== 'light') {
    output = output
      .replace(/\.\s+([A-Z])/g, ', and $1')
      .replace(/, and ([A-Z])/g, '. $1')
      .replace(/\s{2,}/g, ' ');
  }

  if (mode === 'advanced') {
    output = output
      .replace(/\bvery\b/gi, 'remarkably')
      .replace(/\bimportant\b/gi, 'meaningful')
      .replace(/\bquickly\b/gi, 'at an impressive pace');
  }

  return preserveParagraphs(text, output);
}

async function openAiHumanize(text, mode, openai) {
  const selectedMode = MODES[mode];
  const wordCount = countWords(text);

  const response = await openai.responses.create({
    model: DEFAULT_MODEL,
    temperature: selectedMode.temperature,
    max_output_tokens: Math.min(2500, Math.ceil(wordCount * selectedMode.maxTokensMultiplier * 2.2)),
    input: [
      {
        role: 'system',
        content:
          'You are an expert human writing editor. Rewrite text to sound naturally human while preserving meaning, facts, and intent. Keep paragraph breaks and formatting clean.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Mode: ${mode}\nGuidelines: ${selectedMode.instructions}\n\nRequirements:\n- preserve meaning exactly\n- vary sentence starts and lengths\n- reduce robotic repetition\n- improve readability and transitions\n- use contractions where natural\n- return only rewritten text\n\nText:\n${text}`,
          },
        ],
      },
    ],
  });

  const rewritten = response.output_text?.trim();
  if (!rewritten) {
    throw new Error('Empty response from AI provider.');
  }

  return preserveParagraphs(text, rewritten);
}

function createCacheKey(text, mode) {
  return crypto.createHash('sha256').update(`${mode}::${text}`).digest('hex');
}

module.exports = {
  MODES,
  validateMode,
  countWords,
  createCacheKey,
  fallbackHumanize,
  openAiHumanize,
};
