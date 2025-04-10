"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface GameSummaryProps {
  responses: Array<{
    question: string
    answer: string
  }>
  onReset: () => void
}

export function GameSummary({ responses, onReset }: GameSummaryProps) {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-xl font-bold text-center">Game Over!</div>

      <div className="w-full">
        <h3 className="text-lg font-medium mb-3">Your Responses:</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto p-2">
          {responses.map((response, index) => (
            <div key={index} className="border rounded-md p-3">
              <p className="font-medium">{response.question}</p>
              <p className="text-sm text-muted-foreground mt-1">
                You answered: <span className="font-medium">{response.answer}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={onReset} className="flex items-center space-x-2">
        <RefreshCw className="h-5 w-5" />
        <span>Play Again</span>
      </Button>
    </div>
  )
}
