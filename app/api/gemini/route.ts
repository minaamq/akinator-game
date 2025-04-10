import { NextRequest, NextResponse } from "next/server";

// Strict conditions to allow a guess
const MIN_QUESTIONS_FOR_GUESS = 20;
const REQUIRED_CONFIDENCE_THRESHOLD = 0.98;

// Game state and response types
interface GameState {
  currentQuestion: string;
  questionCount: number;
  guessedCharacter?: string;
  confidence?: number;
  gameOver: boolean;
  userResponses: { question: string; answer: string }[];
}

interface QuestionResponse {
  type: "question";
  question: string;
}

interface GuessResponse {
  type: "guess";
  character: string;
  confidence: number;
  question: string;
}

type GeminiResponse = QuestionResponse | GuessResponse;

// Main POST handler
export async function POST(request: NextRequest) {
  try {
    const { gameState } = await request.json();
    if (!gameState) {
      return NextResponse.json({ error: "Missing gameState" }, { status: 400 });
    }
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Default first question
    if (gameState.questionCount === 0) {
      const updatedGameState: GameState = {
        ...gameState,
        currentQuestion: "Is your character a real person (as opposed to fictional)?",
        questionCount: 1,
      };
      return NextResponse.json({ updatedGameState });
    }

    // Build prompt and call Gemini
    const prompt = buildPrompt(gameState);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
          ]
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error("Invalid Gemini API response format");
    const parsed = parseGeminiResponse(textResponse, gameState);
    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Build the Gemini prompt based on game state.
function buildPrompt(gameState: GameState): string {
  const { questionCount, userResponses, gameOver } = gameState;
  let prompt = `You are playing an Akinator-style guessing game.
Rules:
1. Ask strategic yes/no questions to narrow down the possibilities.
2. Do not guess until at least ${MIN_QUESTIONS_FOR_GUESS} questions have been asked.
3. Only provide a guess if you are at least ${REQUIRED_CONFIDENCE_THRESHOLD * 100}% confident.
User responses so far:
${userResponses.map(r => `Q: "${r.question}"\nA: "${r.answer}"`).join("\n\n")}
Questions asked: ${questionCount}.
`;

  if (!gameOver) {
    if (questionCount >= MIN_QUESTIONS_FOR_GUESS) {
      prompt += `If you are at least ${REQUIRED_CONFIDENCE_THRESHOLD * 100}% sure, return a guess in JSON format:
{
  "type": "guess",
  "character": "Your guessed character",
  "confidence": 0.X,
  "question": "Am I right? Is it [character]?"
}
If you are not at that level of confidence, return a yes/no question in JSON format:
{
  "type": "question",
  "question": "Your yes/no question here"
}
`;
    } else {
      prompt += `Return a yes/no question in JSON format:
{
  "type": "question",
  "question": "Your yes/no question here"
}
`;
    }
  }
  return prompt;
}

// Parse Gemini response and update game state.
function parseGeminiResponse(response: string, gameState: GameState) {
  const jsonMatch =
    response.match(/```json\n([\s\S]*?)\n```/) ||
    response.match(/```\n([\s\S]*?)\n```/) ||
    response.match(/{[\s\S]*?}/);
  if (!jsonMatch) throw new Error("JSON extraction failed");

  let jsonString = jsonMatch[0].replace(/```(json)?\n?|```/g, "").trim();
  jsonString = jsonString.replace(/\s+/g, " ").replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');

  let parsed = JSON.parse(jsonString) as GeminiResponse;
  // Convert to question if conditions are not met.
  if (parsed.type === "guess") {
    const guess = parsed as GuessResponse;
    if (gameState.questionCount < MIN_QUESTIONS_FOR_GUESS || guess.confidence < REQUIRED_CONFIDENCE_THRESHOLD) {
      parsed = { type: "question", question: guess.question || "Please continue with a question." };
    }
  }

  // Update game state accordingly.
  const updatedGameState: GameState = { ...gameState, questionCount: gameState.questionCount + 1 };
  if (parsed.type === "question") {
    updatedGameState.currentQuestion = parsed.question;
  } else if (parsed.type === "guess") {
    updatedGameState.currentQuestion = parsed.question;
    updatedGameState.guessedCharacter = (parsed as GuessResponse).character;
    updatedGameState.confidence = (parsed as GuessResponse).confidence;
  }
  return { geminiResponse: parsed, updatedGameState };
}
