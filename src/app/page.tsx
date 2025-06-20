"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Textarea } from "../components/ui/textarea"
import { Badge } from "../components/ui/badge"
import { Loader2, BookOpen, MessageSquare, Lightbulb, ArrowRight } from "lucide-react"

type Step = "category" | "question" | "answer" | "results"

export default function LanguageLearningApp() {
  const [currentStep, setCurrentStep] = useState<Step>("category")
  const [category, setCategory] = useState("")
  const [question, setQuestion] = useState("")
  const [userAnswer, setUserAnswer] = useState("")
  const [enhancedAnswer, setEnhancedAnswer] = useState("")
  const [vocabularies, setVocabularies] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const API_BASE_URL = "http://localhost:8000"

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category.trim()) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_BASE_URL}/category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category: category.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate question")
      }

      const questionText = await response.text()
      // Remove quotes if the response is wrapped in quotes
      const cleanQuestion = questionText.replace(/^"|"$/g, "")
      setQuestion(cleanQuestion)
      setCurrentStep("question")
    } catch (err) {
      setError("Failed to generate question. Please try again.")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userAnswer.trim()) return

    setLoading(true)
    setError("")

    try {
      // First, enhance the user's answer
      const enhanceResponse = await fetch(`${API_BASE_URL}/user_answers_question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_answer_question: userAnswer.trim() }),
      })

      if (!enhanceResponse.ok) {
        throw new Error("Failed to enhance answer")
      }

      const enhancedText = await enhanceResponse.text()
      const cleanEnhanced = enhancedText.replace(/^"|"$/g, "")
      setEnhancedAnswer(cleanEnhanced)

      // Then, get vocabularies from the enhanced answer
      const vocabResponse = await fetch(`${API_BASE_URL}/list_vocabularies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enhanced_answer: cleanEnhanced }),
      })

      if (!vocabResponse.ok) {
        throw new Error("Failed to extract vocabularies")
      }

      const vocabText = await vocabResponse.text()
      const cleanVocab = vocabText.replace(/^"|"$/g, "")

      // Parse the bullet points into an array
      const vocabList = cleanVocab
        .split("\n")
        .filter((line) => line.trim().startsWith("•") || line.trim().startsWith("-"))
        .map((line) => line.replace(/^[•-]\s*/, "").trim())
        .filter((item) => item.length > 0)

      setVocabularies(vocabList)
      setCurrentStep("results")
    } catch (err) {
      setError("Failed to process your answer. Please try again.")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const resetApp = () => {
    setCurrentStep("category")
    setCategory("")
    setQuestion("")
    setUserAnswer("")
    setEnhancedAnswer("")
    setVocabularies([])
    setError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Language Learning Assistant</h1>
          <p className="text-lg text-gray-600">
            Improve your English with AI-powered questions and vocabulary building
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Category Selection */}
        {currentStep === "category" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Step 1: Choose a Category
              </CardTitle>
              <CardDescription>Enter a topic or category you'd like to practice discussing</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="e.g., Travel, Technology, Food, Sports..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="text-lg"
                />
                <Button type="submit" disabled={loading || !category.trim()} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Question...
                    </>
                  ) : (
                    <>
                      Generate Question
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Question Display and Answer Input */}
        {currentStep === "question" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Step 2: Answer the Question
                </CardTitle>
                <CardDescription>
                  Category: <Badge variant="secondary">{category}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-lg font-medium text-blue-900">{question}</p>
                </div>
                <form onSubmit={handleAnswerSubmit} className="space-y-4">
                  <Textarea
                    placeholder="Type your answer here..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="min-h-[120px] text-lg"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading || !userAnswer.trim()} className="flex-1">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Answer...
                        </>
                      ) : (
                        <>
                          Submit Answer
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setCurrentStep("category")}>
                      Back
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Results Display */}
        {currentStep === "results" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Results
                </CardTitle>
                <CardDescription>Your enhanced answer and extracted vocabulary</CardDescription>
              </CardHeader>
            </Card>

            {/* Original Answer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Original Answer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{userAnswer}</p>
              </CardContent>
            </Card>

            {/* Enhanced Answer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enhanced Answer (B2 Level)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900 bg-green-50 p-4 rounded-lg border-l-4 border-green-400">{enhancedAnswer}</p>
              </CardContent>
            </Card>

            {/* Vocabulary List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Vocabulary</CardTitle>
                <CardDescription>Words and phrases from your enhanced answer</CardDescription>
              </CardHeader>
              <CardContent>
                {vocabularies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {vocabularies.map((vocab, index) => (
                      <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                        {vocab}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No vocabulary extracted</p>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={resetApp} className="flex-1">
                Start New Session
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep("category")} className="flex-1">
                Try Another Category
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
