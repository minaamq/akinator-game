"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, ThumbsDown, ThumbsUp } from "lucide-react"

interface GameCharacterProps {
  character: string
  confidence: number
  onResponse: (correct: boolean) => void
  isLoading: boolean
}

export function GameCharacter({ character, confidence, onResponse, isLoading }: GameCharacterProps) {
  // Format confidence as percentage
  const confidencePercentage = Math.round(confidence * 100)

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-xl font-bold text-center">I think you're thinking of...</div>

      <div className="text-3xl font-bold text-center text-primary">{character}</div>

      <div className="w-full space-y-2">
        <div className="flex justify-between text-sm">
          <span>Confidence</span>
          <span>{confidencePercentage}%</span>
        </div>
        <Progress value={confidencePercentage} className="h-2" />
      </div>

      <div className="text-center">
        <p>Am I right?</p>
      </div>

      <div className="flex space-x-4">
        <Button
          variant="default"
          size="lg"
          onClick={() => onResponse(true)}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <ThumbsUp className="h-5 w-5" />
          <span>Yes!</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => onResponse(false)}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <ThumbsDown className="h-5 w-5" />
          <span>No</span>
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Processing...</span>
        </div>
      )}
    </div>
  )
}
