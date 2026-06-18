export function formatTranscriptParagraphs(text: string, targetLength = 650): string[] {
  const sentences = text.trim().split(/(?<=[.!?…])\s+/u).filter(Boolean);
  const paragraphs: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current && current.length + sentence.length + 1 > targetLength) {
      paragraphs.push(current);
      current = "";
    }
    if (sentence.length <= targetLength) {
      current = current ? `${current} ${sentence}` : sentence;
      continue;
    }
    const words = sentence.split(/\s+/);
    for (const word of words) {
      if (current && current.length + word.length + 1 > targetLength) {
        paragraphs.push(current);
        current = "";
      }
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) paragraphs.push(current);
  return paragraphs;
}

export function chunkTranscript(text: string, maxLength = 8_000): string[] {
  if (text.length <= maxLength) return [text.trim()];
  const paragraphs = formatTranscriptParagraphs(text, maxLength);
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 2 > maxLength) {
      chunks.push(current); current = "";
    }
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  if (current) chunks.push(current);
  return chunks;
}
