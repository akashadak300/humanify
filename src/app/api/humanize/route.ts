import { NextResponse } from "next/server";
import { HumanizerOrchestrator } from "@/lib/pipeline/orchestrator";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      text,
      tone,
      formality,
      synonymIntensity,
      transitionFreq,
      creativity,
      contextPreservation,
      preserveIntent,
      verificationAlgorithm,
      synonymEngine
    } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Initialize the orchestrator
    const orchestrator = new HumanizerOrchestrator();

    // Run the text through the pipeline
    const result = await orchestrator.process(text, {
      tone,
      formality,
      synonymIntensity,
      transitionFreq,
      creativity,
      contextPreservation,
      preserveIntent,
      verificationAlgorithm,
      synonymEngine
    });

    return NextResponse.json(result);
    
  } catch (error) {
    console.error("Humanize API Error:", error);
    return NextResponse.json({ error: "Failed to process text." }, { status: 500 });
  }
}
