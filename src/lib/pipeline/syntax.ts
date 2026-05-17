import nlp from "compromise";
import { TransformationLog } from "./synonyms";

export class SyntaxEngine {
  public static process(text: string, formality: string): { text: string; logs: TransformationLog[] } {
    let doc = nlp(text);
    let logs: TransformationLog[] = [];

    if (formality === "formal") {
      const contractions = doc.contractions().out('array');
      if (contractions.length > 0) {
        doc.contractions().expand();
        contractions.forEach((c: string) => {
          logs.push({
            type: "Syntax",
            original: c,
            replacement: "[Expanded]",
            confidence: 0.99
          });
        });
      }
    } else if (formality === "informal") {
      const phrases = doc.match('#Copula #Negative').out('array');
      (doc.contractions() as any).contract();
      if (phrases.length > 0) {
         logs.push({
            type: "Syntax",
            original: "Expanded phrasing",
            replacement: "[Contracted]",
            confidence: 0.99
          });
      }
    }

    return { text: doc.text(), logs };
  }
}
