"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, ThumbsUp, ThumbsDown, HelpCircle, Sparkles, Star, Lightbulb } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti" 

interface GameState {
  currentQuestion: string
  questionCount: number
  guessedCharacter?: string
  confidence?: number
  gameOver: boolean
  userResponses: Array<{
    question: string
    answer: string
  }>
}

export function GameContainer() {
  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: "",
    questionCount: 0,
    gameOver: false,
    userResponses: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [isCorrectGuess, setIsCorrectGuess] = useState(false)
  const [genieState, setGenieState] = useState<"thinking" | "asking" | "guessing" | "correct" | "wrong" | "idle">("idle")

  // Start a new game
  const startGame = async () => {
    setIsLoading(true)
    setError(null)
    setGameStarted(true)
    setIsCorrectGuess(false)
    setGenieState("thinking")

    try {
      const initialGameState = {
        currentQuestion: "",
        questionCount: 0,
        gameOver: false,
        userResponses: [],
      }

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gameState: initialGameState }),
      })

      if (!response.ok) {
        throw new Error(`Failed to start game: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.updatedGameState) {
        setGameState(data.updatedGameState)
        setGenieState("asking")
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      console.error("Start game error:", err)
      setError("Failed to start game. Please try again.")
      setGenieState("idle")
    } finally {
      setIsLoading(false)
    }
  }

  // Reset the game
  const resetGame = () => {
    setGameState({
      currentQuestion: "",
      questionCount: 0,
      gameOver: false,
      userResponses: [],
    })
    setGameStarted(false)
    setError(null)
    setIsCorrectGuess(false)
    setGenieState("idle")
  }

  // Handle user's answer to a question
  const handleAnswer = async (answer: "yes" | "no" | "unsure") => {
    setIsLoading(true)
    setError(null)
    setGenieState("thinking")

    try {
      const updatedResponses = [
        ...gameState.userResponses,
        {
          question: gameState.currentQuestion,
          answer: answer,
        },
      ]

      const updatedGameState = {
        ...gameState,
        userResponses: updatedResponses,
      }

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gameState: updatedGameState }),
      })

      if (!response.ok) {
        throw new Error(`Failed to process answer: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.updatedGameState) {
        setGameState(data.updatedGameState)
        if (data.updatedGameState.guessedCharacter) {
          setGenieState("guessing")
        } else if (data.updatedGameState.gameOver) {
          setGenieState("wrong")
        } else {
          setGenieState("asking")
        }
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      console.error("Handle answer error:", err)
      setError("Failed to process your answer. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Trigger confetti when the guess is correct
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ["#1e40af", "#3b82f6", "#f97316", "#fb923c", "#fed7aa"],
    })
  }

  // Handle correct guess
  const handleCorrectGuess = () => {
    setIsCorrectGuess(true)
    setGameState({
      ...gameState,
      gameOver: true,
    })
    setGenieState("correct")
    triggerConfetti()
  }

  // Calculate progress percentage
  const progressPercentage = Math.min(100, (gameState.questionCount / 20) * 100)

  return (
    <div className="w-full max-w-5xl mx-auto px-4 overflow-hidden">
      {/* Using flex-col-reverse on mobile and flex-row on medium+ screens */}
      <motion.div
        className="flex flex-col-reverse md:flex-row gap-6 items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Game Content Column */}
        <motion.div
          className="w-full md:w-2/3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="w-full border-orange-300 bg-white/95 backdrop-blur shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
              <div className="flex justify-center mb-2">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3 }}
                >
                  <Lightbulb className="h-8 w-8 text-orange-300" />
                </motion.div>
              </div>
              <CardTitle className="text-center text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-200 to-orange-100">
                Akinator
              </CardTitle>
              <CardDescription className="text-center text-blue-100">
                Think of a character, and I'll guess who it is!
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 md:p-8 overflow-visible">
              <AnimatePresence mode="wait">
                {!gameStarted ? (
                  <motion.div
                    key="start-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center p-6"
                  >
                    <motion.p
                      className="mb-6 text-lg text-blue-800"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      I'll ask you a series of yes/no questions to figure out what you're thinking of. Ready to play?
                    </motion.p>
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                    >
                      <Button
                        onClick={startGame}
                        disabled={isLoading}
                        size="lg"
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          "Play"
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="game-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center space-y-6"
                  >
                    {!gameState.gameOver && !gameState.guessedCharacter && (
                      <motion.div
                        className="text-lg font-medium text-center py-2 px-4 bg-orange-100 rounded-full text-orange-800"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        Question #{gameState.questionCount}
                      </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                      {gameState.guessedCharacter ? (
                        <motion.div
                          key="guess"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="flex flex-col items-center space-y-4 w-full"
                        >
                          <motion.div
                            className="text-xl font-bold text-center text-blue-800"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                          >
                            I think of...
                          </motion.div>
                          <motion.div
                            className="text-3xl font-bold text-center text-blue-600 p-6 border-2 border-orange-300 rounded-lg bg-gradient-to-r from-blue-50 to-orange-50 w-full max-w-md mx-auto"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                              scale: 1,
                              opacity: 1,
                              boxShadow: [
                                "0px 0px 0px rgba(249, 115, 22, 0)",
                                "0px 0px 20px rgba(249, 115, 22, 0.4)",
                                "0px 0px 0px rgba(249, 115, 22, 0)",
                              ],
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 200,
                              boxShadow: { repeat: Number.POSITIVE_INFINITY, duration: 2 },
                            }}
                          >
                            {gameState.guessedCharacter}
                          </motion.div>
                          <div className="text-center">
                            <p>Am I right?</p>
                          </div>
                          <div className="flex space-x-4">
                            <Button
                              variant="default"
                              onClick={handleCorrectGuess}
                              disabled={isLoading}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                            >
                              <ThumbsUp className="mr-2 h-5 w-5" />
                              Yes!
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleAnswer("no")}
                              disabled={isLoading}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <ThumbsDown className="mr-2 h-5 w-5" />
                              No
                            </Button>
                          </div>
                        </motion.div>
                      ) : gameState.gameOver ? (
                        <motion.div
                          key="game-over"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="flex flex-col items-center space-y-4"
                        >
                          {isCorrectGuess ? (
                            <>
                              <motion.div
                                className="text-2xl font-bold text-center text-green-600"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.5 }}
                              >
                                I got it right!
                              </motion.div>
                              <motion.div
                                animate={{
                                  rotate: [0, 10, -10, 0],
                                  scale: [1, 1.2, 1],
                                }}
                                transition={{ repeat: 2, duration: 0.5 }}
                              >
                                <Sparkles className="h-16 w-16 text-orange-400" />
                              </motion.div>
                            </>
                          ) : (
                            <div className="text-xl font-bold text-center text-blue-800">Game Over!</div>
                          )}
                          <Button
                            onClick={resetGame}
                            className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
                          >
                            Play Again
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="question"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto"
                        >
                          {/* Speech bubble for question */}
                          <div className="relative w-full">
                            <motion.div
                              className="text-lg text-center font-medium p-6 border border-orange-200 rounded-2xl bg-gradient-to-r from-blue-50 to-orange-50 w-full relative"
                              animate={{
                                boxShadow: [
                                  "0px 0px 0px rgba(249, 115, 22, 0)",
                                  "0px 0px 8px rgba(249, 115, 22, 0.3)",
                                  "0px 0px 0px rgba(249, 115, 22, 0)",
                                ],
                              }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                            >
                              {gameState.currentQuestion || "Thinking of a question..."}

                              {/* Speech bubble tail */}
                              <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-r-[15px] border-r-orange-50 border-b-[10px] border-b-transparent" />
                            </motion.div>
                          </div>

                          <div className="flex flex-wrap justify-center gap-3">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                onClick={() => handleAnswer("yes")}
                                disabled={isLoading || !gameState.currentQuestion}
                                className="border-green-300 text-green-600 hover:bg-green-50 min-w-[100px]"
                              >
                                <ThumbsUp className="mr-2 h-5 w-5" />
                                Yes
                              </Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                onClick={() => handleAnswer("no")}
                                disabled={isLoading || !gameState.currentQuestion}
                                className="border-red-300 text-red-600 hover:bg-red-50 min-w-[100px]"
                              >
                                <ThumbsDown className="mr-2 h-5 w-5" />
                                No
                              </Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                onClick={() => handleAnswer("unsure")}
                                disabled={isLoading || !gameState.currentQuestion}
                                className="border-orange-300 text-orange-600 hover:bg-orange-50 min-w-[100px]"
                              >
                                <HelpCircle className="mr-2 h-5 w-5" />
                                Don't know
                              </Button>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center p-4"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-orange-300" />
                          </div>
                          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                        </div>
                        <span className="ml-3 text-blue-700 font-medium">Thinking...</span>
                      </motion.div>
                    )}

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-red-100 text-red-700 rounded-md w-full"
                      >
                        {error}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>

            <CardFooter className="flex justify-between bg-gradient-to-r from-blue-50 to-orange-50 p-4">
              <div className="text-sm text-blue-600 font-medium">
                {gameState.questionCount > 0 && `Questions: ${gameState.questionCount}/20`}
              </div>
              {gameStarted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetGame}
                  disabled={isLoading}
                  className="border-orange-200 text-blue-700 hover:bg-orange-50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Game
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>

        {/* Genie Column */}
        <motion.div
          className="w-full md:w-1/3 flex justify-center items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative">
            <motion.div
              animate={
                genieState === "thinking"
                  ? { rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }
                  : genieState === "correct"
                  ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
                  : {}
              }
              transition={{
                repeat: genieState === "thinking" ? Number.POSITIVE_INFINITY : 0,
                duration: genieState === "thinking" ? 1.5 : 0.5,
                ease: "easeInOut",
              }}
              className="relative z-10"
            > 
          { genieState !== "thinking" && (
  
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
                <img
                 src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeml2bTQ5aHZpYjc1ZHRwNGg2NjlraWRhNXJ6eWh3bHpjcHloN2cxMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/mDYBgNVs7sBAeDv9Gt/giphy.gif"
                 alt="Akinator Genie"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
           )}
              {genieState === "thinking" && (

<div className="flex space-x-1">
  <img
    src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExOWNzaHk1bGtoNnRjMWo4cmd3cW5ia29lenN6bmFmMHk2MmQ2YW5lZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/m93LJkUU866ORIhU8O/giphy.gif"

    alt="Akinator Genie"
    className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain rounded-lg -scale-x-100"
  />
                    <motion.div
                      className="w-2 h-2 bg-blue-500 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.6, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-blue-500 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.6, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-blue-500 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.6, delay: 0.4 }}
                    />
                  </div>
  
              )}

              {genieState === "correct" && (
                <motion.div
                  className="absolute -top-4 -right-4"
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ scale: [0, 1.2, 1], rotate: [0, 20] }}
                  transition={{ duration: 0.5 }}
                >
                  <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                </motion.div>
              )}
            </motion.div>

            {/* Magic lamp base */}
            <motion.div
              className="w-24 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-full mx-auto -mt-3 relative z-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-28 h-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mx-auto absolute -bottom-2 left-1/2 transform -translate-x-1/2" />

              {/* Magic smoke animation */}
              <motion.div
                className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 0.7, 0], y: [-5, -15] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3, delay: 1 }}
              >
                <div className="w-3 h-3 bg-blue-200 rounded-full opacity-70" />
              </motion.div>
              <motion.div
                className="absolute -top-4 left-[40%] transform -translate-x-1/2"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 0.5, 0], y: [-2, -12] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.5, delay: 0.5 }}
              >
                <div className="w-2 h-2 bg-blue-200 rounded-full opacity-70" />
              </motion.div>
              <motion.div
                className="absolute -top-4 left-[60%] transform -translate-x-1/2"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 0.6, 0], y: [-3, -10] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, delay: 0.2 }}
              >
                <div className="w-2 h-2 bg-blue-200 rounded-full opacity-70" />
              </motion.div>
            </motion.div>
          </div>

          {/* Progress bar for Genie column on mobile (optional)
          {gameStarted && !gameState.gameOver && (
            <motion.div
              className="w-full mt-6 px-4 max-w-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="text-center mb-2 text-sm font-medium text-blue-700">
                Progress: {Math.round(progressPercentage)}%
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-blue-600 to-orange-500 h-2.5"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between text-xs text-blue-600 mt-1">
                <span>0</span>
                <span>20</span>
              </div>
            </motion.div>
          )} */}
        </motion.div>
      </motion.div>
    </div>
  )
}
