import stringSimilarity from "string-similarity";

export class Verifier {
  private static weightedLevenshteinDistance(str1: string, str2: string, weights = { insertion: 1, deletion: 1, substitution: 2 }): number {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i * weights.deletion;
    }
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j * weights.insertion;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + weights.deletion, 
          track[j - 1][i] + weights.insertion, 
          track[j - 1][i - 1] + indicator * weights.substitution 
        );
      }
    }
    return track[str2.length][str1.length];
  }

  public static verify(
    original: string, 
    transformed: string, 
    contextPreservationLimit: number,
    algorithm: 'dice' | 'levenshtein' = 'dice'
  ): { verifiedText: string, retention: number } {
    
    const threshold = contextPreservationLimit / 100;
    let similarity = 0;

    if (algorithm === 'levenshtein') {
      const distance = this.weightedLevenshteinDistance(original, transformed);
      const maxLength = Math.max(original.length, transformed.length);
      
      // Calculate max possible penalty (maxLength * max weight which is substitution: 2)
      const maxPossibleDistance = maxLength * 2;
      
      // Normalize to 0-1 similarity scale
      similarity = Math.max(0, 1 - (distance / (maxPossibleDistance > 0 ? maxPossibleDistance : 1)));
    } else {
      // Default: Sørensen–Dice Coefficient
      similarity = stringSimilarity.compareTwoStrings(original, transformed);
    }

    if (similarity < threshold) {
      return { verifiedText: original, retention: 100 };
    }

    return { 
      verifiedText: transformed, 
      retention: Math.round(similarity * 100) 
    };
  }
}
