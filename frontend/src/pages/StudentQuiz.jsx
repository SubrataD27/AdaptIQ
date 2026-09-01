// SoP US4 (Subrata): adaptive quiz UI, plus US8's random-mode toggle and instant per-answer feedback
// Quiz picker below (choosing a teacher-published quiz vs. open-subject practice): SoP US2 (Annandita)
import { useEffect, useState } from "react";
import { api, getUser } from "../api/client";

const SUBJECT = "Data Structures";

export default function StudentQuiz() {
  const user = getUser();
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoaded, setQuizzesLoaded] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null); // null = open subject-wide practice
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState("adaptive");
  const [question, setQuestion] = useState(null);
  const [currentConceptId, setCurrentConceptId] = useState(null);
  const [askedConceptIds, setAskedConceptIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [complete, setComplete] = useState(false);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/quizzes/active", { params: { subject: SUBJECT } })
      .then((res) => {
        setQuizzes(res.data);
        if (res.data.length > 0) setSelectedQuiz(res.data[0]);
      })
      .catch(() => {})
      .finally(() => setQuizzesLoaded(true));
  }, []);

  const loadNext = async (excludeIds) => {
    setError("");
    try {
      const res = await api.get(`/quiz/next-question/${user.id}`, {
        params: {
          subject: SUBJECT, mode, exclude_concept_ids: excludeIds.join(","),
          quiz_id: selectedQuiz ? selectedQuiz.id : undefined,
        },
      });
      if (res.data.complete || !res.data.question) {
        setComplete(true);
        setQuestion(null);
        setCurrentConceptId(null);
      } else {
        setQuestion(res.data.question);
        setCurrentConceptId(res.data.concept_id);
        setFeedback(null);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load the next question.");
    }
  };

  const start = () => {
    setStarted(true);
    setComplete(false);
    setAskedConceptIds([]);
    setCount(0);
    loadNext([]);
  };

  const submit = async (option) => {
    setError("");
    try {
      const res = await api.post("/quiz/submit-answer", {
        student_id: user.id, question_id: question.id, selected_option: option, mode,
        quiz_id: selectedQuiz ? selectedQuiz.id : null,
      });
      setFeedback(res.data);
      setCount((c) => c + 1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit your answer.");
    }
  };

  const next = () => {
    const updated = [...askedConceptIds, currentConceptId];
    setAskedConceptIds(updated);
    loadNext(updated);
  };

  return (
    <div className="page">
      <h2>Adaptive Quiz — {SUBJECT}</h2>
      {error && <div className="alert alert-error">{error}</div>}

      {!started && quizzesLoaded && (
        <div className="card">
          {quizzes.length > 0 && (
            <>
              <p>Pick a quiz your teacher published, or practice across the whole subject.</p>
              <div className="quiz-picker">
                {quizzes.map((q) => (
                  <label key={q.id} className="quiz-picker-option">
                    <input
                      type="radio"
                      name="quiz-picker"
                      checked={selectedQuiz?.id === q.id}
                      onChange={() => setSelectedQuiz(q)}
                    />
                    {q.title} ({q.concept_ids.length} concept{q.concept_ids.length === 1 ? "" : "s"})
                  </label>
                ))}
                <label className="quiz-picker-option">
                  <input
                    type="radio"
                    name="quiz-picker"
                    checked={selectedQuiz === null}
                    onChange={() => setSelectedQuiz(null)}
                  />
                  Practice — whole subject
                </label>
              </div>
            </>
          )}
          <p>Choose a mode and start. AdaptIQ will pick each next question based on your current per-concept mastery.</p>
          <div className="mode-toggle">
            <label>
              <input type="radio" checked={mode === "adaptive"} onChange={() => setMode("adaptive")} /> Adaptive
            </label>
            <label>
              <input type="radio" checked={mode === "random"} onChange={() => setMode("random")} /> Random
            </label>
          </div>
          <button className="btn btn-primary" onClick={start}>Start Quiz</button>
        </div>
      )}

      {started && complete && (
        <div className="card quiz-complete">
          <h3>Quiz complete!</h3>
          <p>
            You answered {count} question{count === 1 ? "" : "s"} across every concept
            {selectedQuiz ? ` in "${selectedQuiz.title}"` : ` in ${SUBJECT}`}.
          </p>
          <a className="btn btn-primary" href="/mastery">View Mastery Map</a>
        </div>
      )}

      {started && !complete && question && (
        <div className="card">
          <div className="quiz-meta">Question {count + 1}</div>
          <p className="quiz-question">{question.text}</p>
          <div className="quiz-options">
            {["a", "b", "c", "d"].map((opt) => (
              <button
                key={opt}
                className="btn btn-option"
                disabled={!!feedback}
                onClick={() => submit(opt)}
              >
                {question[`option_${opt}`]}
              </button>
            ))}
          </div>
          {feedback && (
            <div className={`feedback ${feedback.correct ? "feedback-correct" : "feedback-incorrect"}`}>
              <p>{feedback.correct ? "Correct!" : `Incorrect. Correct answer: ${feedback.correct_option.toUpperCase()}`}</p>
              <p className="mastery-shift">
                Mastery: {(feedback.p_mastery_before * 100).toFixed(0)}% → {(feedback.p_mastery_after * 100).toFixed(0)}%
              </p>
              <button className="btn btn-primary" onClick={next}>Next Question</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
