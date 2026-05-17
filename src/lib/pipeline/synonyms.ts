import nlp from "compromise";

export interface TransformationLog {
  type: "Synonym" | "Syntax" | "Transition" | "Structural";
  original: string;
  replacement: string;
  confidence: number;
}

export class SynonymEngine {
  private static dictionary: Record<string, Record<string, string[]>> = {
    positive: {
      good: ["excellent", "superb", "outstanding", "stellar"],
      important: ["vital", "crucial", "essential", "paramount"],
      make: ["create", "generate", "produce", "forge"],
      use: ["utilize", "leverage", "employ", "harness"],
    },
    neutral: {
      good: ["adequate", "satisfactory", "acceptable"],
      important: ["notable", "significant", "relevant"],
      make: ["build", "construct", "assemble"],
      use: ["apply", "implement", "operate"],
    },
    persuasive: {
      good: ["unrivaled", "exceptional", "transformative"],
      important: ["critical", "urgent", "imperative"],
      make: ["pioneer", "revolutionize", "establish"],
      use: ["maximize", "capitalize on", "exploit"],
    }
  };

  public static process(sentence: string, intensity: number, tone: string): { text: string; logs: TransformationLog[] } {
    if (intensity === 0) return { text: sentence, logs: [] };

    let doc = nlp(sentence);
    let logs: TransformationLog[] = [];

    const adjectives = doc.adjectives().out('array');
    const verbs = doc.verbs().out('array');
    const wordsToConsider = [...adjectives, ...verbs];
    
    const toneDict = this.dictionary[tone] || this.dictionary["neutral"];

    for (const word of wordsToConsider) {
      if (Math.random() > intensity) continue;

      const normalizedWord = word.toLowerCase().trim();
      
      if (toneDict[normalizedWord]) {
        const synonyms = toneDict[normalizedWord];
        const randomSynonym = synonyms[Math.floor(Math.random() * synonyms.length)];
        
        doc.match(normalizedWord).replaceWith(randomSynonym);
        
        logs.push({
          type: "Synonym",
          original: word,
          replacement: randomSynonym,
          confidence: Math.round((0.8 + Math.random() * 0.15) * 100) / 100 // Mock 80-95% confidence
        });
      }
    }

    return { text: doc.text(), logs };
  }
}
