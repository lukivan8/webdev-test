"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import questions from "../../questions.json";

const LABELS = ["A", "B", "C", "D", "E"];

export default function DashboardPage() {
  const submissions = useQuery(api.submissions.getSubmissions);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const exportCSV = () => {
    if (!submissions) return;
    const header = "Имя,Telegram,Баллы,Дата\n";
    const rows = submissions
      .map((s) => {
        const date = new Date(s.submittedAt).toLocaleString("ru-RU");
        return `"${s.studentName}","${s.telegramHandle}",${s.score}/${s.totalQuestions},"${date}"`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Результаты экзамена
            </h1>
            <p className="text-sm text-muted mt-1">
              {submissions === undefined
                ? "Загрузка..."
                : `${submissions.length} ${submissions.length === 1 ? "ответ" : submissions.length < 5 ? "ответа" : "ответов"}`}
            </p>
          </div>
          <button
            onClick={exportCSV}
            disabled={!submissions?.length}
            className="inline-flex items-center gap-2 bg-surface border border-border text-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Экспорт CSV
          </button>
        </div>

        {/* Content */}
        {submissions === undefined ? (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <div className="text-muted text-sm">Загрузка результатов...</div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <div className="text-muted text-sm">Пока нет ответов</div>
          </div>
        ) : (
          <div className="space-y-2">
            {submissions.map((s, i) => {
              const pct = Math.round((s.score / s.totalQuestions) * 100);
              const isExpanded = expandedId === s._id;
              return (
                <div
                  key={s._id}
                  className="bg-surface rounded-xl border border-border overflow-hidden"
                >
                  {/* Row */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : s._id)}
                    className="w-full text-left flex items-center gap-4 px-5 py-3.5 hover:bg-background/50 transition-colors"
                  >
                    <span className="text-xs text-muted w-6 flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-medium text-sm text-foreground min-w-[120px]">
                      {s.studentName}
                    </span>
                    <span className="text-sm text-muted min-w-[100px]">
                      {s.telegramHandle}
                    </span>
                    <div className="flex items-center gap-2.5 ml-auto">
                      <div className="w-16 bg-background rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${pct >= 70 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-danger"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span
                        className={`font-mono text-xs font-bold w-10 ${pct >= 70 ? "text-success" : pct >= 50 ? "text-warning" : "text-danger"}`}
                      >
                        {s.score}/{s.totalQuestions}
                      </span>
                    </div>
                    <span className="text-xs text-muted ml-4 hidden sm:block">
                      {new Date(s.submittedAt).toLocaleString("ru-RU")}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-4 h-4 text-muted flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Expanded answers */}
                  {isExpanded && (
                    <div className="border-t border-border px-5 py-4 bg-background/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {questions.map((q, qi) => {
                          const studentAnswer = s.answers[qi];
                          const isCorrect = studentAnswer === q.correctIndex;
                          return (
                            <div
                              key={q.id}
                              className={`rounded-lg border p-3 text-xs ${isCorrect ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5"}`}
                            >
                              <div className="flex items-start gap-2 mb-2">
                                <span
                                  className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${isCorrect ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}
                                >
                                  {q.id}
                                </span>
                                <span className="text-foreground/80 leading-snug line-clamp-2">
                                  {q.question}
                                </span>
                              </div>
                              <div className="ml-7 space-y-0.5">
                                {studentAnswer !== q.correctIndex && (
                                  <div className="text-danger flex gap-1.5">
                                    <span>&#10007;</span>
                                    <span>
                                      {LABELS[studentAnswer]}:{" "}
                                      {q.options[studentAnswer]}
                                    </span>
                                  </div>
                                )}
                                <div className="text-success flex gap-1.5">
                                  <span>&#10003;</span>
                                  <span>
                                    {LABELS[q.correctIndex]}:{" "}
                                    {q.options[q.correctIndex]}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
