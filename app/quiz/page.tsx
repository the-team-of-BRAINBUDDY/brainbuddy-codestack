"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { addHistoryItem } from "@/lib/history";

const quizzes = {
  HTML: [
    {
      question: "What does HTML stand for?",
      options: [
        "Hyper Text Markup Language",
        "High Text Machine Language",
        "Hyper Transfer Markup Language",
        "Home Tool Markup Language",
      ],
      answer: "Hyper Text Markup Language",
    },
    {
      question: "Which tag creates a hyperlink?",
      options: ["<link>", "<a>", "<href>", "<url>"],
      answer: "<a>",
    },
    {
      question: "Which tag inserts an image?",
      options: ["<img>", "<image>", "<pic>", "<src>"],
      answer: "<img>",
    },
    {
      question: "Which tag is used for headings?",
      options: ["<head>", "<h1>", "<title>", "<heading>"],
      answer: "<h1>",
    },
    {
      question: "Which tag creates a paragraph?",
      options: ["<text>", "<p>", "<para>", "<paragraph>"],
      answer: "<p>",
    },
    {
      question: "HTML is used for?",
      options: [
        "Styling",
        "Structure of webpages",
        "Database",
        "Programming",
      ],
      answer: "Structure of webpages",
    },
    {
      question: "Which tag creates a line break?",
      options: ["<lb>", "<br>", "<break>", "<hr>"],
      answer: "<br>",
    },
    {
      question: "Which tag creates a list?",
      options: ["<list>", "<ul>", "<ol>", "Both <ul> and <ol>"],
      answer: "Both <ul> and <ol>",
    },
    {
      question: "Which attribute specifies image path?",
      options: ["href", "src", "alt", "path"],
      answer: "src",
    },
    {
      question: "HTML files end with?",
      options: [".html", ".ht", ".web", ".doc"],
      answer: ".html",
    },
  ],

  Flutter: [
    {
      question: "Flutter uses which language?",
      options: ["Java", "Python", "Dart", "C++"],
      answer: "Dart",
    },
    {
      question: "Flutter is developed by?",
      options: ["Apple", "Google", "Microsoft", "Meta"],
      answer: "Google",
    },
    {
      question: "Flutter is mainly used for?",
      options: [
        "Game Development",
        "Mobile App Development",
        "Database",
        "Networking",
      ],
      answer: "Mobile App Development",
    },
    {
      question: "Flutter UI is built using?",
      options: ["Activities", "Widgets", "Fragments", "Views"],
      answer: "Widgets",
    },
    {
      question: "Which command runs Flutter app?",
      options: [
        "flutter start",
        "flutter run",
        "flutter build",
        "flutter execute",
      ],
      answer: "flutter run",
    },
    {
      question: "Flutter supports?",
      options: [
        "Android only",
        "iOS only",
        "Android & iOS",
        "Windows only",
      ],
      answer: "Android & iOS",
    },
    {
      question: "Which widget is stateless?",
      options: [
        "StatefulWidget",
        "StatelessWidget",
        "Container",
        "Scaffold",
      ],
      answer: "StatelessWidget",
    },
    {
      question: "Flutter package manager is?",
      options: ["npm", "pub", "pip", "composer"],
      answer: "pub",
    },
    {
      question: "Flutter hot reload helps?",
      options: [
        "Delete app",
        "Instant UI updates",
        "Install package",
        "Compile Java",
      ],
      answer: "Instant UI updates",
    },
    {
      question: "Flutter apps are written in?",
      options: ["Swift", "Java", "Dart", "Kotlin"],
      answer: "Dart",
    },
  ],

  Java: [
    {
      question: "Java is a?",
      options: [
        "Programming Language",
        "Database",
        "Browser",
        "Operating System",
      ],
      answer: "Programming Language",
    },
    {
      question: "Who developed Java?",
      options: ["Google", "Microsoft", "Sun Microsystems", "Apple"],
      answer: "Sun Microsystems",
    },
    {
      question: "Java source file extension?",
      options: [".java", ".js", ".class", ".jar"],
      answer: ".java",
    },
    {
      question: "Java is?",
      options: [
        "Platform Independent",
        "Platform Dependent",
        "Database",
        "Framework",
      ],
      answer: "Platform Independent",
    },
    {
      question: "JVM stands for?",
      options: [
        "Java Virtual Machine",
        "Java Variable Method",
        "Joint VM",
        "Java Version Manager",
      ],
      answer: "Java Virtual Machine",
    },
    {
      question: "Which keyword creates object?",
      options: ["new", "class", "this", "void"],
      answer: "new",
    },
    {
      question: "Java supports?",
      options: ["OOP", "POP", "Assembly", "SQL"],
      answer: "OOP",
    },
    {
      question: "Entry point of Java program?",
      options: ["main()", "start()", "run()", "init()"],
      answer: "main()",
    },
    {
      question: "Java compiler creates?",
      options: [
        "Bytecode",
        "Machine Code",
        "HTML",
        "Python Code",
      ],
      answer: "Bytecode",
    },
    {
      question: "Java is strongly?",
      options: ["Typed", "Untyped", "Compiled Only", "None"],
      answer: "Typed",
    },
  ],
};

const quickTopics = [
  { name: "React Hooks", icon: "⚛️" },
  { name: "JavaScript ES6", icon: "💛" },
  { name: "World History", icon: "🌍" },
  { name: "Space Exploration", icon: "🚀" },
  { name: "Machine Learning", icon: "🧠" },
];

export default function QuizPage() {
  const [subject, setSubject] = useState<string>("HTML");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [activeTopicName, setActiveTopicName] = useState<string>("HTML");
  const [questions, setQuestions] = useState<any[]>(quizzes.HTML);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<Record<number, string>>({}); // Maps question index -> selected option

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(quizzes.HTML.map((q) => q.question));
  const [activeLanguage, setActiveLanguage] = useState<string>("English");

  useEffect(() => {
    const saved = localStorage.getItem("brainbuddy_language");
    if (saved) {
      setActiveLanguage(saved);
    }
  }, []);

  async function generateQuiz(topicName: string, isNext = false) {
    if (!topicName.trim()) return;

    setIsLoading(true);
    setError(null);

    const excludeList = isNext ? history : [];

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topicName,
          exclude: excludeList,
          language: activeLanguage,
        }),
      });

      const responseData = await res.json();

      if (responseData.success && responseData.questions && responseData.questions.length > 0) {
        const newQuestions = responseData.questions;
        setQuestions(newQuestions);
        setScore(0);
        setAnswered({});
        setActiveTopicName(topicName);

        const newQuestionTexts = newQuestions.map((q: any) => q.question);
        if (isNext) {
          setHistory((prev) => [...prev, ...newQuestionTexts]);
        } else {
          setHistory(newQuestionTexts);
        }

        addHistoryItem("Quiz", `Generated Quiz: ${topicName}`, `10 MCQs in ${activeLanguage}`);
      } else {
        setError(responseData.error || "Failed to generate quiz questions.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while communicating with the quiz server.");
    } finally {
      setIsLoading(false);
    }
  }

  function selectAnswer(index: number, option: string) {
    if (answered[index] !== undefined) return;

    const correctOption = questions[index].answer;
    if (option === correctOption) {
      setScore((prev) => prev + 1);
    }

    setAnswered((prev) => ({
      ...prev,
      [index]: option,
    }));
  }

  function restart() {
    setScore(0);
    setAnswered({});
  }

  function handleDropdownChange(val: string) {
    setSubject(val);
    if (val in quizzes) {
      const qList = quizzes[val as keyof typeof quizzes];
      setQuestions(qList);
      setScore(0);
      setAnswered({});
      setActiveTopicName(val);
      setHistory(qList.map((q) => q.question));
    }
  }

  const answeredCount = Object.keys(answered).length;
  const completionPercentage = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.1),_transparent_30%),linear-gradient(135deg,_#060816_0%,_#090b14_100%)] text-white p-6 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 tracking-tight mb-3">
            🧠 BrainBuddy Quiz Arena
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
            Test your knowledge! Select a predefined topic, or type any topic below to generate a custom quiz using AI.
          </p>
        </div>

        {/* Control Center */}
        <div className="bg-[#121424]/60 border border-white/5 rounded-3xl p-6 mb-8 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search input */}
            <div className="w-full md:flex-1 relative flex gap-2">
              <input
                type="text"
                placeholder="🔍 Type any topic (e.g. React Hooks, World War II...)"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customTopic.trim()) {
                    generateQuiz(customTopic);
                  }
                }}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white outline-none placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all duration-300"
              />
              <button
                onClick={() => generateQuiz(customTopic)}
                disabled={isLoading || !customTopic.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-blue-800/35 disabled:to-indigo-800/35 disabled:opacity-40 text-white font-semibold px-6 py-3.5 rounded-2xl transition duration-300 shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] shrink-0"
              >
                Generate
              </button>
            </div>


          </div>

          {/* Quick topic suggestion pills */}
          <div className="mt-5 flex flex-wrap gap-2 items-center">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mr-1">Suggestions:</span>
            {quickTopics.map((topicItem) => (
              <button
                key={topicItem.name}
                onClick={() => {
                  setCustomTopic(topicItem.name);
                  generateQuiz(topicItem.name);
                }}
                disabled={isLoading}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white px-3 py-1.5 rounded-full text-xs font-medium border border-white/5 transition-all duration-200"
              >
                <span>{topicItem.icon}</span>
                <span>{topicItem.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Active Topic Banner */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-950/20 to-indigo-950/25 border-l-4 border-blue-500 px-6 py-4 rounded-r-2xl">
          <div>
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Active Quiz Topic</span>
            <h2 className="text-xl font-bold text-white mt-0.5">{activeTopicName}</h2>
          </div>
          <div className="text-right">
            <span className="text-gray-400 text-sm font-medium">
              Answered: <strong className="text-blue-400">{answeredCount}</strong> / {questions.length}
            </span>
          </div>
        </div>

        {/* Sticky Progress Bar */}
        {questions.length > 0 && (
          <div className="h-1.5 w-full bg-gray-800/60 rounded-full mb-8 overflow-hidden">
            <div
              style={{ width: `${completionPercentage}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-500 ease-out"
            ></div>
          </div>
        )}

        {/* Errors */}
        {error && (
          <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-4 mb-8 text-red-200 text-sm flex gap-3 items-center">
            <span className="text-xl">⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="animate-pulse space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#121424]/40 border border-white/5 p-6 rounded-2xl">
                <div className="h-6 bg-white/10 rounded w-3/4 mb-5"></div>
                <div className="space-y-3">
                  <div className="h-12 bg-white/5 rounded-xl w-full"></div>
                  <div className="h-12 bg-white/5 rounded-xl w-full"></div>
                  <div className="h-12 bg-white/5 rounded-xl w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Questions list */
          <div className="space-y-6">
            {questions.map((q, index) => {
              const isAnswered = answered[index] !== undefined;

              return (
                <div
                  key={index}
                  className="bg-[#121424]/50 border border-white/5 hover:border-white/10 p-6 rounded-2xl transition duration-300 shadow-md"
                >
                  <h3 className="text-lg font-semibold text-gray-100 mb-5 leading-relaxed flex gap-2">
                    <span className="text-blue-400 font-bold">{index + 1}.</span>
                    <span>{q.question}</span>
                  </h3>

                  <div className="space-y-3">
                    {q.options.map((option: string) => {
                      const selectedOption = answered[index];
                      const isSelected = selectedOption === option;
                      const isCorrect = option === q.answer;

                      let btnStyle = "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-gray-300";
                      let icon = null;

                      if (isAnswered) {
                        if (isCorrect) {
                          btnStyle = "bg-green-950/40 border-green-500/70 text-green-200 font-semibold shadow-[0_0_12px_rgba(34,197,94,0.12)]";
                          icon = (
                            <span className="h-5 w-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs border border-green-500/30">
                              ✓
                            </span>
                          );
                        } else if (isSelected) {
                          btnStyle = "bg-red-950/40 border-red-500/70 text-red-200 font-semibold shadow-[0_0_12px_rgba(239,68,68,0.12)]";
                          icon = (
                            <span className="h-5 w-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs border border-red-500/30">
                              ✗
                            </span>
                          );
                        } else {
                          btnStyle = "bg-black/20 border-white/5 text-gray-500 opacity-60 cursor-not-allowed";
                        }
                      }

                      return (
                        <button
                          key={option}
                          disabled={isAnswered}
                          onClick={() => selectAnswer(index, option)}
                          className={`flex items-center justify-between w-full text-left p-4 rounded-xl border text-sm sm:text-base transition-all duration-200 outline-none ${btnStyle}`}
                        >
                          <span>{option}</span>
                          {icon}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Score & Actions Panel */}
            <div className="mt-10 bg-gradient-to-b from-[#121424]/80 to-[#0a0c16]/90 border border-white/5 rounded-3xl p-8 text-center shadow-xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-300">
                Score: {score} / {questions.length}
              </h2>
              <p className="text-gray-400 text-sm mt-2 mb-6">
                {answeredCount < questions.length
                  ? `Completed ${answeredCount} of ${questions.length} questions. Keep going!`
                  : "Excellent job! You completed the quiz."}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={restart}
                  className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-gray-200 font-semibold px-8 py-3.5 rounded-2xl border border-white/5 active:scale-95 transition-all duration-200"
                >
                  Restart Quiz
                </button>
                <button
                  onClick={() => generateQuiz(activeTopicName, true)}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-blue-800/40 disabled:to-indigo-800/40 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-2xl transition-all duration-300 shadow-[0_4px_14px_rgba(59,130,246,0.25)] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>New Quiz (Next 10 MCQs)</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}