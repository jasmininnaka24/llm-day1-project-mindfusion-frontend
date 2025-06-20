"use client"

import type React from "react"
import { useState } from "react"
import "./App.css"

type Step = "category" | "question" | "answer" | "results"

function App() {
  const [currentStep, setCurrentStep] = useState<Step>("category")
  const [category, setCategory] = useState("")
  const [question, setQuestion] = useState("")
  const [userAnswer, setUserAnswer] = useState("")
  const [enhancedAnswer, setEnhancedAnswer] = useState("")
  const [vocabularies, setVocabularies] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // const API_BASE_URL = "http://127.0.0.1:8000"
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
const handleCategorySubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!category.trim()) return;

  setLoading(true);
  setError("");

  try {
    const response = await fetch(`${API_BASE_URL}/category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category: category.trim() }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate question");
    }

    const data = await response.json(); // ⬅ updated
    setQuestion(data.question);         // ⬅ updated
    setCurrentStep("question");
  } catch (err) {
    setError("Failed to generate question. Please try again.");
    console.error("Error:", err);
  } finally {
    setLoading(false);
  }
};


  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Step 1: Enhance the user's answer
      const enhanceResponse = await fetch(`${API_BASE_URL}/user_answers_question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_answer_question: userAnswer.trim() }),
      });

      if (!enhanceResponse.ok) {
        throw new Error("Failed to enhance answer");
      }

      const enhancedText = await enhanceResponse.text();
      const cleanEnhanced = enhancedText.replace(/^"|"$/g, "");
      setEnhancedAnswer(cleanEnhanced);

      // Step 2: Get vocabularies from the enhanced answer
      const vocabResponse = await fetch(`${API_BASE_URL}/list_vocabularies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enhanced_answer: cleanEnhanced }),
      });

      if (!vocabResponse.ok) {
        throw new Error("Failed to extract vocabularies");
      }

      const vocabText = await vocabResponse.text();
      const cleanVocab = vocabText.replace(/^"|"$/g, "");

      // Step 3: Parse vocabulary list cleanly
      const vocabList = cleanVocab
        .split(/\\n|[\n\r]+/) // handle both real and escaped line breaks
        .flatMap(line => line.split(/[-•]\s*/)) // split inline bullets
        .map(word => word.trim())
        .filter(word => word.length > 0);

      setVocabularies(vocabList);
      setCurrentStep("results");
    } catch (err) {
      setError("Failed to process your answer. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>Language Learning Assistant</h1>
          <p>Improve your English with AI-powered questions and vocabulary building</p>
        </div>

        {error && (
          <div className="error-card">
            <p>{error}</p>
          </div>
        )}

        {/* Step 1: Category Selection */}
        {currentStep === "category" && (
          <div className="card">
            <div className="card-header">
              <h2>📚 Step 1: Choose a Category</h2>
              <p>Enter a topic or category you'd like to practice discussing</p>
            </div>
            <div className="card-content">
              <form onSubmit={handleCategorySubmit}>
                <input
                  type="text"
                  placeholder="e.g., Travel, Technology, Food, Sports..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input"
                />
                <button type="submit" disabled={loading || !category.trim()} className="button primary">
                  {loading ? "Generating Question..." : "Generate Question →"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Step 2: Question Display and Answer Input */}
        {currentStep === "question" && (
          <div className="space-y">
            <div className="card">
              <div className="card-header">
                <h2>💬 Step 2: Answer the Question</h2>
                <p>
                  Category: <span className="badge">{category}</span>
                </p>
              </div>
              <div className="card-content">
                <div className="question-box">
                  <p>{question}</p>
                </div>
                <form onSubmit={handleAnswerSubmit}>
                  <textarea
                    placeholder="Type your answer here..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="textarea"
                    rows={5}
                  />
                  <div className="button-group">
                    <button type="submit" disabled={loading || !userAnswer.trim()} className="button primary flex-1">
                      {loading ? "Processing Answer..." : "Submit Answer →"}
                    </button>
                    <button type="button" onClick={() => setCurrentStep("category")} className="button secondary">
                      Back
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Results Display */}
        {currentStep === "results" && (
          <div className="space-y">
            <div className="card">
              <div className="card-header">
                <h2>💡 Results</h2>
                <p>Your enhanced answer and extracted vocabulary</p>
              </div>
            </div>

            {/* Original Answer */}
            <div className="card">
              <div className="card-header">
                <h3>Your Original Answer</h3>
              </div>
              <div className="card-content">
                <div className="answer-box original">{userAnswer}</div>
              </div>
            </div>

            {/* Enhanced Answer */}
            <div className="card">
              <div className="card-header">
                <h3>Enhanced Answer</h3>
              </div>
              <div className="card-content">
                <div className="answer-box enhanced">{enhancedAnswer}</div>
              </div>
            </div>

            {/* Vocabulary List */}
            <div className="card">
              <div className="card-header">
                <h3>Key Vocabulary</h3>
                <p>Words and phrases from your enhanced answer</p>
              </div>
              <div className="card-content">
                {vocabularies.length > 0 ? (
                  <ul className="list-disc ml-6 space-y-1">
                    {vocabularies.map((vocab, index) => (
                      <li key={index}>{vocab}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-vocab">No vocabulary extracted</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="button-group">
              <button onClick={resetApp} className="button primary flex-1">
                Start New Session
              </button>
              <button onClick={() => setCurrentStep("category")} className="button secondary flex-1">
                Try Another Category
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
