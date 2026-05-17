import { TransformationLog } from "./synonyms";

export class MarkovEngine {
  public static process(text: string, creativity: number): { text: string; logs: TransformationLog[] } {
    if (creativity <= 0) return { text, logs: [] };
    
    const shuffleProbability = (creativity / 100) * 0.3;
    let logs: TransformationLog[] = [];

    const words = text.split(/\s+/);
    if (words.length < 5) return { text, logs: [] };

    const transitionMap = new Map<string, string[]>();
    for (let i = 0; i < words.length - 1; i++) {
      const currentWord = words[i].toLowerCase().replace(/[^\w]/g, "");
      const nextWord = words[i + 1];
      
      if (!currentWord) continue;

      if (!transitionMap.has(currentWord)) {
        transitionMap.set(currentWord, []);
      }
      transitionMap.get(currentWord)!.push(nextWord);
    }

    let newWords = [...words];
    let shuffled = false;

    for (let i = 1; i < newWords.length - 1; i++) {
      if (Math.random() < shuffleProbability) {
        const prevWord = newWords[i - 1].toLowerCase().replace(/[^\w]/g, "");
        const possibleNextWords = transitionMap.get(prevWord);
        
        if (possibleNextWords && possibleNextWords.length > 1) {
          const randomNext = possibleNextWords[Math.floor(Math.random() * possibleNextWords.length)];
          if (newWords[i] !== randomNext) {
            newWords[i] = randomNext;
            shuffled = true;
          }
        }
      }
    }

    if (shuffled) {
      logs.push({
        type: "Structural",
        original: "Original Sequence",
        replacement: "Markov Shuffled",
        confidence: 0.85
      });
    }

    return { text: newWords.join(" "), logs };
  }
}
