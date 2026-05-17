import stringSimilarity from "string-similarity";

export class Verifier {
  public static verify(original: string, transformed: string, contextPreservationLimit: number): { verifiedText: string, retention: number } {
    // Determine the threshold. The UI passes it as 0-100.
    const threshold = contextPreservationLimit / 100;

    // Use Dice's Coefficient to calculate similarity
    const similarity = stringSimilarity.compareTwoStrings(original, transformed);

    // If similarity drops below the strict threshold, reject the changes entirely
    // to preserve exact intent and context.
    if (similarity < threshold) {
      return { verifiedText: original, retention: 100 };
    }

    return { 
      verifiedText: transformed, 
      retention: Math.round(similarity * 100) 
    };
  }
}
