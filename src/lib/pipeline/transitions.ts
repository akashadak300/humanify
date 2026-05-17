import { TransformationLog } from "./synonyms";

export class TransitionEngine {
  private static academicTransitions = [
    "Furthermore,", "Moreover,", "In addition,", "Consequently,", 
    "Therefore,", "Thus,", "Hence,", "Notably,", "Significantly,",
    "As a result,", "Importantly,"
  ];

  private static naturalTransitions = [
    "Also,", "Plus,", "And so,", "Because of this,", "Basically,",
    "In short,", "To sum up,", "Actually,", "To be honest,"
  ];

  public static process(sentence: string, frequency: number, tone: string): { text: string; logs: TransformationLog[] } {
    if (Math.random() > frequency) {
      return { text: sentence, logs: [] };
    }

    const firstWord = sentence.split(" ")[0].toLowerCase();
    const commonStarts = ["furthermore,", "moreover,", "however,", "also,", "therefore,"];
    if (commonStarts.includes(firstWord)) {
      return { text: sentence, logs: [] };
    }

    let pool = this.academicTransitions;
    if (tone === "casual" || tone === "informal") {
      pool = this.naturalTransitions;
    }

    const transition = pool[Math.floor(Math.random() * pool.length)];
    
    let modifiedSentence = sentence;
    const firstChar = sentence.charAt(0);
    
    const downcaseWords = ["The", "A", "An", "He", "She", "It", "They", "We", "I", "This", "That", "These", "Those"];
    let firstWordReal = sentence.split(" ")[0];
    firstWordReal = firstWordReal.replace(/[^\w\s]|_/g, "");
    
    if (downcaseWords.includes(firstWordReal)) {
      modifiedSentence = firstChar.toLowerCase() + sentence.slice(1);
    }

    const newText = `${transition} ${modifiedSentence}`;
    
    return {
      text: newText,
      logs: [{
        type: "Transition",
        original: "[Start of sentence]",
        replacement: transition,
        confidence: 0.95
      }]
    };
  }
}
