"use client";

import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useMemo, useState } from "react";
import questions from "../questions.json";

const LABELS = ["A", "B", "C", "D", "E"];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

type ShuffledOption = { originalIndex: number; text: string };

function shuffleOptions(
  options: string[],
  rng: () => number,
): ShuffledOption[] {
  const arr = options.map((text, i) => ({ originalIndex: i, text }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function QuizPage() {
  const submitQuiz = useMutation(api.submissions.submitQuiz);
  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null),
  );
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");

  const shuffledQuestions = useMemo(() => {
    if (!started) return null;
    const seed = hashString(name.trim() + telegram.trim());
    const rng = mulberry32(seed);
    return questions.map((q) => ({
      ...q,
      shuffledOptions: shuffleOptions(q.options, rng),
    }));
  }, [started, name, telegram]);

  const handleStart = () => {
    if (!name.trim() || !telegram.trim()) {
      setError("Заполните все поля");
      return;
    }
    setError("");
    setStarted(true);
  };

  const handleSelect = (qIndex: number, originalIndex: number) => {
    if (submitted) return;
    const next = [...answers];
    next[qIndex] = originalIndex;
    setAnswers(next);
  };

  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) {
      setError("Ответьте на все вопросы");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await submitQuiz({
        studentName: name.trim(),
        telegramHandle: telegram.trim(),
        answers: answers as number[],
      });
      setScore(result);
      setSubmitted(true);
    } catch {
      setError("Ошибка при отправке. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  // --- Start screen ---
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                Экзамен по веб-разработке
              </h1>
              <p className="text-sm text-muted mt-1">
                20 вопросов с вариантами ответа
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                  Имя и фамилия
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  placeholder="Иван Иванов"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                  Telegram
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  placeholder="@username"
                />
              </div>
              {error && (
                <p className="text-danger text-sm bg-danger/5 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <button
                onClick={handleStart}
                className="w-full bg-accent text-white py-2.5 rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors mt-2"
              >
                Начать экзамен
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Result screen ---
  if (submitted && score !== null) {
    const pct = Math.round((score / questions.length) * 100);
    const color =
      pct >= 70 ? "text-success" : pct >= 50 ? "text-warning" : "text-danger";
    return (
      <div className="min-h-screen pb-12">
        <div className="max-w-2xl mx-auto px-4 pt-10">
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 text-center mb-8">
            <div className={`text-6xl font-bold ${color} mb-2`}>
              {score}
              <span className="text-3xl text-muted">/{questions.length}</span>
            </div>
            <div className="text-lg font-semibold text-foreground mt-4">
              Экзамен завершён
            </div>
            <p className="text-sm text-muted mt-2">
              {name}, ваши ответы успешно отправлены
            </p>
            <div className="mt-6 w-full bg-background rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${pct >= 70 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-danger"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-2">{pct}% правильных ответов</p>
          </div>

          <h2 className="text-sm font-semibold text-foreground mb-4">
            Разбор ответов
          </h2>
          <div className="space-y-4">
            {questions.map((q, qi) => {
              const studentAnswer = answers[qi];
              const isCorrect = studentAnswer === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={`bg-surface rounded-xl border p-5 ${isCorrect ? "border-success/30" : "border-danger/30"}`}
                >
                  <div className="flex items-start gap-2.5 mb-3">
                    <span
                      className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${isCorrect ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
                    >
                      {q.id}
                    </span>
                    <h3 className="text-sm font-medium text-foreground leading-relaxed">
                      {q.question}
                    </h3>
                  </div>
                  <div className="space-y-1.5 ml-8.5">
                    {q.options.map((opt, oi) => {
                      const isStudentChoice = studentAnswer === oi;
                      const isCorrectOption = q.correctIndex === oi;
                      let cls = "bg-background text-foreground/60";
                      if (isCorrectOption)
                        cls = "bg-success/10 text-success font-medium";
                      else if (isStudentChoice)
                        cls = "bg-danger/10 text-danger font-medium";
                      return (
                        <div
                          key={oi}
                          className={`flex items-start gap-2.5 px-3 py-2 rounded-lg text-sm ${cls}`}
                        >
                          <span className="font-bold text-xs mt-0.5 w-4 flex-shrink-0">
                            {LABELS[oi]}
                          </span>
                          <span>{opt}</span>
                          {isCorrectOption && (
                            <span className="ml-auto text-xs flex-shrink-0">
                              &#10003;
                            </span>
                          )}
                          {isStudentChoice && !isCorrectOption && (
                            <span className="ml-auto text-xs flex-shrink-0">
                              &#10007;
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- Quiz screen ---
  const answeredCount = answers.filter((a) => a !== null).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="min-h-screen pb-12">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
                {answeredCount}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {name}
                </div>
                <div className="text-xs text-muted">
                  Экзамен по веб-разработке
                </div>
              </div>
            </div>
            <div className="text-xs text-muted font-medium">
              {answeredCount} из {questions.length}
            </div>
          </div>
          <div className="w-full bg-background rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-5">
        {shuffledQuestions!.map((q, qi) => (
          <div
            key={q.id}
            className="bg-surface rounded-xl border border-border p-5"
          >
            <h3 className="text-sm font-medium text-foreground leading-relaxed mb-4">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-accent/10 text-accent text-xs font-bold mr-2.5 flex-shrink-0">
                {q.id}
              </span>
              {q.question}
            </h3>
            <div className="space-y-2">
              {q.shuffledOptions.map((opt, displayIndex) => {
                const isSelected = answers[qi] === opt.originalIndex;
                return (
                  <button
                    type="button"
                    key={opt.originalIndex}
                    onClick={() => handleSelect(qi, opt.originalIndex)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg transition-all text-sm ${
                      isSelected
                        ? "bg-accent/10 border border-accent/40 text-foreground"
                        : "bg-background border border-transparent hover:border-border text-foreground/80 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold mt-0.5 transition-all ${
                        isSelected
                          ? "bg-accent text-white"
                          : "bg-border/50 text-muted"
                      }`}
                    >
                      {LABELS[displayIndex]}
                    </span>
                    <span className="pt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="max-w-2xl mx-auto px-4 mt-8">
        {error && (
          <p className="text-danger text-sm bg-danger/5 rounded-lg px-4 py-2.5 mb-4">
            {error}
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading || submitted}
          className="w-full bg-accent text-white py-3 rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Отправка..." : "Отправить ответы"}
        </button>
      </div>
    </div>
  );
}
