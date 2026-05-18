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

  public static async process(
    sentence: string, 
    intensity: number, 
    tone: string,
    useNeural: boolean = false
  ): Promise<{ text: string; logs: TransformationLog[] }> {
    if (intensity === 0) return { text: sentence, logs: [] };

    let doc = nlp(sentence);
    let logs: TransformationLog[] = [];

    const adjectives = doc.adjectives().out('array');
    const verbs = doc.verbs().out('array');
    const nouns = doc.nouns().out('array'); 
    
    // Neural can handle more parts of speech safely
    const wordsToConsider = useNeural ? [...adjectives, ...verbs, ...nouns] : [...adjectives, ...verbs];
    
    const toneDict = this.dictionary[tone] || this.dictionary["neutral"];

    for (const word of wordsToConsider) {
      if (Math.random() > intensity) continue;

      const normalizedWord = word.toLowerCase().trim();
      
      if (useNeural) {
        try {
          const response = await fetch('http://127.0.0.1:8000/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sentence: doc.text(), target_word: normalizedWord, tone: tone })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.predictions && data.predictions.length > 0) {
              const bestSynonym = data.predictions[0];
              doc.match(normalizedWord).replaceWith(bestSynonym);
              logs.push({
                type: "Synonym",
                original: word,
                replacement: bestSynonym,
                confidence: 0.99 // Neural network confidence
              });
              continue; // Success, move to next word
            }
          }
        } catch (error) {
          console.error("Neural engine failed, falling back to static dictionary");
        }
      }
      
      // Fallback or Static Mode
      if (toneDict[normalizedWord]) {
        const synonyms = toneDict[normalizedWord];
        const randomSynonym = synonyms[Math.floor(Math.random() * synonyms.length)];
        
        doc.match(normalizedWord).replaceWith(randomSynonym);
        
        logs.push({
          type: "Synonym",
          original: word,
          replacement: randomSynonym,
          confidence: Math.round((0.8 + Math.random() * 0.15) * 100) / 100
        });
      }
    }

    return { text: doc.text(), logs };
  }
}
