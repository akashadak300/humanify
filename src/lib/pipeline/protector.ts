export class Protector {
  private citationRegexes = [
    /\[\d+\]/g, // e.g. [1]
    /\([A-Z][a-z]+(?: et al\.)?, \d{4}\)/g, // e.g. (Smith, 2024) or (Smith et al., 2024)
    /https?:\/\/[^\s]+/g, // URLs
  ];

  public protectCitations(text: string): { protectedText: string; dictionary: Map<string, string> } {
    let protectedText = text;
    const dictionary = new Map<string, string>();
    let counter = 0;

    for (const regex of this.citationRegexes) {
      protectedText = protectedText.replace(regex, (match) => {
        const token = `__PROTECT_${counter}__`;
        dictionary.set(token, match);
        counter++;
        return token;
      });
    }

    return { protectedText, dictionary };
  }

  public restoreCitations(text: string, dictionary: Map<string, string>): string {
    let restoredText = text;
    for (const [token, original] of dictionary.entries()) {
      restoredText = restoredText.replace(token, original);
    }
    return restoredText;
  }
}
