function splitSentences(text = '') {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function uniqueWordRatio(text = '') {
  const words = text.toLowerCase().match(/[a-z0-9']+/g) || [];
  if (!words.length) return 0;

  const unique = new Set(words);
  return unique.size / words.length;
}

function readabilityScore(text = '') {
  const words = text.match(/\S+/g) || [];
  const sentences = splitSentences(text);
  if (!words.length || !sentences.length) return 0;

  const syllables = words.reduce((sum, word) => sum + estimateSyllables(word), 0);
  const wordsPerSentence = words.length / sentences.length;
  const syllablesPerWord = syllables / words.length;

  const flesch = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  return Math.max(0, Math.min(100, flesch));
}

function estimateSyllables(word = '') {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!normalized) return 1;

  const groups = normalized.match(/[aeiouy]+/g);
  let count = groups ? groups.length : 1;

  if (normalized.endsWith('e')) count -= 1;
  return Math.max(1, count);
}

function sentenceVariationScore(text = '') {
  const sentences = splitSentences(text);
  if (sentences.length < 2) return 20;

  const lengths = sentences.map((s) => (s.match(/\S+/g) || []).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, len) => sum + (len - avg) ** 2, 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  return Math.max(0, Math.min(100, stdDev * 8));
}

function burstinessScore(text = '') {
  const sentences = splitSentences(text);
  if (!sentences.length) return 0;

  const lengths = sentences.map((s) => (s.match(/\S+/g) || []).length);
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  if (max === 0) return 0;

  return Math.max(0, Math.min(100, ((max - min) / max) * 100));
}

function humanLikenessScore(text = '') {
  const sentenceVariation = sentenceVariationScore(text);
  const vocabularyDiversity = uniqueWordRatio(text) * 100;
  const readability = readabilityScore(text);
  const burstiness = burstinessScore(text);

  const weighted =
    sentenceVariation * 0.3 +
    vocabularyDiversity * 0.3 +
    readability * 0.2 +
    burstiness * 0.2;

  return {
    score: Math.round(Math.max(0, Math.min(100, weighted))),
    metrics: {
      sentenceVariation: Math.round(sentenceVariation),
      vocabularyDiversity: Math.round(vocabularyDiversity),
      readability: Math.round(readability),
      burstiness: Math.round(burstiness),
    },
  };
}

module.exports = {
  humanLikenessScore,
};
