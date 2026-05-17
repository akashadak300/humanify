import nlp from "compromise";
import { Protector } from "./protector";
import { SyntaxEngine } from "./syntax";
import { SynonymEngine, TransformationLog } from "./synonyms";
import { TransitionEngine } from "./transitions";
import { MarkovEngine } from "./markov";
import { Verifier } from "./verifier";

export interface HumanizerConfig {
  tone: string;
  formality: string;
  synonymIntensity: number[];
  transitionFreq: number[];
  creativity: number[];
  contextPreservation: number[];
  preserveIntent: boolean;
}

export interface ProcessingResult {
  originalText: string;
  humanizedText: string;
  confidenceScore: number;
  semanticRetention: number;
  wordsAdded: number;
  transformations: TransformationLog[];
}

export class HumanizerOrchestrator {
  private protector: Protector;

  constructor() {
    this.protector = new Protector();
  }

  public process(text: string, config: HumanizerConfig): ProcessingResult {
    const { protectedText, dictionary } = this.protector.protectCitations(text);
    const lines = protectedText.split('\n');
    let outLines: string[] = [];
    let allLogs: TransformationLog[] = [];
    let totalOriginalSentences = 0;
    let totalRetentionScore = 0;
    
    for (let ln of lines) {
      if (!ln.trim()) {
        outLines.push("");
        continue;
      }

      const sentences = nlp(ln).sentences().out('array') || [ln];
      totalOriginalSentences += sentences.length;
      
      let processedSentences = sentences.map((sentence: string) => {
        let processed = sentence;
        
        // Syntax
        const syntaxResult = SyntaxEngine.process(processed, config.formality);
        processed = syntaxResult.text;
        allLogs = allLogs.concat(syntaxResult.logs);

        // Synonyms
        const synonymResult = SynonymEngine.process(processed, config.synonymIntensity[0], config.tone);
        processed = synonymResult.text;
        allLogs = allLogs.concat(synonymResult.logs);

        // Transitions
        const transitionResult = TransitionEngine.process(processed, config.transitionFreq[0], config.tone);
        processed = transitionResult.text;
        allLogs = allLogs.concat(transitionResult.logs);

        // Verification
        if (config.preserveIntent) {
          const { verifiedText, retention } = Verifier.verify(sentence, processed, config.contextPreservation[0]);
          totalRetentionScore += retention;
          return verifiedText;
        } else {
          totalRetentionScore += 100;
          return processed;
        }
      });
      
      outLines.push(processedSentences.join(' '));
    }
    
    let intermediateText = outLines.join('\n');

    // Markov Shuffler
    const markovResult = MarkovEngine.process(intermediateText, config.creativity[0]);
    intermediateText = markovResult.text;
    allLogs = allLogs.concat(markovResult.logs);

    // Restoration
    const finalText = this.protector.restoreCitations(intermediateText, dictionary);

    const wordsAdded = finalText.split(/\s+/).length - text.split(/\s+/).length;
    const avgRetention = Math.round(totalRetentionScore / (totalOriginalSentences || 1));
    const confidenceScore = Math.min(100, Math.round((avgRetention * 0.8) + (config.creativity[0] * 0.2)));

    return {
      originalText: text,
      humanizedText: finalText,
      confidenceScore: confidenceScore,
      semanticRetention: avgRetention,
      wordsAdded: wordsAdded,
      transformations: allLogs
    };
  }
}
