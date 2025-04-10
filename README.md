# Gemini Akinator

An Akinator-like game powered by Google Gemini AI. This application uses Next.js App Router and the Google Gemini API to create a character guessing game similar to Akinator.

## Features

- Interactive character guessing game
- Powered by Google Gemini AI
- Responsive design
- Dark mode support

## How to Play

1. Think of a character, person, animal, or thing
2. The AI will ask you a series of yes/no questions
3. Answer truthfully to help the AI guess what you're thinking of
4. After several questions, the AI will make a guess
5. Tell the AI if it guessed correctly or not

## Getting Started

First, set up your environment variables:

\`\`\`bash
GOOGLE_GEMINI_API_KEY=your_api_key_here
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How It Works

The application uses the Google Gemini API to generate questions and make guesses based on the user's responses. The game flow is as follows:

1. The user starts a new game
2. The AI asks a series of yes/no questions
3. After several questions, the AI makes a guess
4. If the guess is correct, the game ends
5. If the guess is incorrect, the AI continues asking questions
6. The game ends when the AI makes a correct guess or gives up

## Technologies Used

- Next.js 14 with App Router
- React
- Google Gemini API
- Tailwind CSS
- shadcn/ui components
