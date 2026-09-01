// US-05, US-07, US-08, US-09: adaptive quiz UI with instant feedback
import { useState } from "react";
import { api } from "../api/client";

export default function StudentQuiz() {
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const studentId = 1; // TODO: pull from auth context

  const loadNext = async (mode = "adaptive") => {
    const res = await api.get(`/quiz/next-question/${studentId}`, { params: { subject: "Data Structures", mode } });
    setQuestion(res.data.question);
    setFeedback(null);
  };

  const submit = async (option) => {
    const res = await api.post("/quiz/submit-answer", {
      student_id: studentId, question_id: question.id, selected_option: option, mode: "adaptive",
    });
    setFeedback(res.data);
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}>
      <button onClick={() => loadNext()}>Start / Next Question</button>
      {question && (
        <div>
          <p>{question.text}</p>
          {["a", "b", "c", "d"].map((opt) => (
            <button key={opt} onClick={() => submit(opt)}>{question[`option_${opt}`]}</button>
          ))}
        </div>
      )}
      {feedback && <p>{feedback.correct ? "Correct!" : `Incorrect. Correct answer: ${feedback.correct_option}`}</p>}
    </div>
  );
}
