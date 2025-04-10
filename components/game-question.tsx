"use client"

import { Button } from "@/components/ui/button"
import { Loader2, ThumbsDown, ThumbsUp, HelpCircle } from "lucide-react"

interface GameQuestionProps {
  question: string
  questionNumber: number
  onAnswer: (answer: "yes" | "no" | "unsure") => void
  isLoading: boolean
}

export function GameQuestion({ question, questionNumber, onAnswer, isLoading }: GameQuestionProps) {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-lg font-medium text-center">Question #{questionNumber}</div>

      <div className="text-xl text-center font-semibold">{question || "Thinking of a question..."}</div>

      <div className="flex space-x-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => onAnswer("yes")}
          disabled={isLoading || !question}
          className="flex items-center space-x-2"
        >
          <ThumbsUp className="h-5 w-5" />
          <span>Yes</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => onAnswer("no")}
          disabled={isLoading || !question}
          className="flex items-center space-x-2"
        >
          <ThumbsDown className="h-5 w-5" />
          <span>No</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => onAnswer("unsure")}
          disabled={isLoading || !question}
          className="flex items-center space-x-2"
        >
          <HelpCircle className="h-5 w-5" />
          <span>Unsure</span>
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Thinking...</span>
        </div>
      )}
    </div>
  )
}
