"""Seeds the question bank for the pilot subject on API startup. Idempotent."""
from sqlalchemy.orm import Session
from app import models

SUBJECT = "Data Structures"

CONCEPTS = [
    {"name": "Arrays", "p_init": 0.3, "p_learn": 0.25, "p_slip": 0.1, "p_guess": 0.2},
    {"name": "Linked Lists", "p_init": 0.25, "p_learn": 0.2, "p_slip": 0.1, "p_guess": 0.2},
    {"name": "Stacks", "p_init": 0.3, "p_learn": 0.25, "p_slip": 0.1, "p_guess": 0.25},
    {"name": "Queues", "p_init": 0.3, "p_learn": 0.25, "p_slip": 0.1, "p_guess": 0.25},
    {"name": "Trees", "p_init": 0.2, "p_learn": 0.15, "p_slip": 0.15, "p_guess": 0.2},
    {"name": "Graphs", "p_init": 0.15, "p_learn": 0.15, "p_slip": 0.15, "p_guess": 0.2},
]

QUESTIONS = {
    "Arrays": [
        {"text": "What is the time complexity of accessing an element by index in an array?",
         "option_a": "O(1)", "option_b": "O(n)", "option_c": "O(log n)", "option_d": "O(n^2)",
         "correct_option": "a", "difficulty": "easy"},
        {"text": "Inserting a new element at the beginning of a full array of size n requires shifting how many elements in the worst case?",
         "option_a": "0", "option_b": "1", "option_c": "log n", "option_d": "n",
         "correct_option": "d", "difficulty": "medium"},
        {"text": "Which of these is a key disadvantage of arrays compared to linked lists?",
         "option_a": "Slow random access", "option_b": "Fixed/expensive-to-resize size",
         "option_c": "No index-based access", "option_d": "Cannot store primitives",
         "correct_option": "b", "difficulty": "medium"},
    ],
    "Linked Lists": [
        {"text": "What is the time complexity of accessing the k-th element of a singly linked list?",
         "option_a": "O(1)", "option_b": "O(log n)", "option_c": "O(n)", "option_d": "O(n log n)",
         "correct_option": "c", "difficulty": "easy"},
        {"text": "What does each node in a singly linked list typically contain?",
         "option_a": "Only data", "option_b": "Data and a pointer to the next node",
         "option_c": "Two pointers and no data", "option_d": "An index and a value",
         "correct_option": "b", "difficulty": "easy"},
        {"text": "What is the main advantage of a linked list over an array for inserting at the front?",
         "option_a": "O(1) insertion with no shifting", "option_b": "Better cache locality",
         "option_c": "Constant-time random access", "option_d": "Lower memory usage per element",
         "correct_option": "a", "difficulty": "medium"},
    ],
    "Stacks": [
        {"text": "Which ordering principle does a stack follow?",
         "option_a": "FIFO", "option_b": "LIFO", "option_c": "Random", "option_d": "Priority-based",
         "correct_option": "b", "difficulty": "easy"},
        {"text": "Which operation removes and returns the top element of a stack?",
         "option_a": "enqueue", "option_b": "dequeue", "option_c": "pop", "option_d": "peek",
         "correct_option": "c", "difficulty": "easy"},
        {"text": "Which real-world use case is a classic application of a stack?",
         "option_a": "Browser back button / undo history", "option_b": "Print job scheduling",
         "option_c": "Shortest path routing", "option_d": "Task scheduling by priority",
         "correct_option": "a", "difficulty": "medium"},
    ],
    "Queues": [
        {"text": "Which ordering principle does a queue follow?",
         "option_a": "LIFO", "option_b": "FIFO", "option_c": "Random", "option_d": "Depth-first",
         "correct_option": "b", "difficulty": "easy"},
        {"text": "Which operation adds an element to the rear of a queue?",
         "option_a": "push", "option_b": "pop", "option_c": "enqueue", "option_d": "peek",
         "correct_option": "c", "difficulty": "easy"},
        {"text": "Which data structure is typically used to implement a breadth-first search (BFS) traversal?",
         "option_a": "Stack", "option_b": "Queue", "option_c": "Heap", "option_d": "Hash map",
         "correct_option": "b", "difficulty": "medium"},
    ],
    "Trees": [
        {"text": "What is the maximum number of children a node can have in a binary tree?",
         "option_a": "1", "option_b": "2", "option_c": "3", "option_d": "Unlimited",
         "correct_option": "b", "difficulty": "easy"},
        {"text": "What is the average time complexity of searching in a balanced binary search tree?",
         "option_a": "O(1)", "option_b": "O(n)", "option_c": "O(log n)", "option_d": "O(n^2)",
         "correct_option": "c", "difficulty": "medium"},
        {"text": "Which traversal visits nodes in Left-Root-Right order?",
         "option_a": "Preorder", "option_b": "Inorder", "option_c": "Postorder", "option_d": "Level-order",
         "correct_option": "b", "difficulty": "medium"},
    ],
    "Graphs": [
        {"text": "Which data structure is commonly used to implement depth-first search (DFS) iteratively?",
         "option_a": "Queue", "option_b": "Stack", "option_c": "Heap", "option_d": "Linked list",
         "correct_option": "b", "difficulty": "medium"},
        {"text": "A connected graph with no cycles is called a:",
         "option_a": "Tree", "option_b": "Forest", "option_c": "DAG", "option_d": "Clique",
         "correct_option": "a", "difficulty": "medium"},
        {"text": "Which algorithm finds the shortest path in a weighted graph with non-negative edge weights?",
         "option_a": "Depth-first search", "option_b": "Kruskal's algorithm",
         "option_c": "Dijkstra's algorithm", "option_d": "Binary search",
         "correct_option": "c", "difficulty": "hard"},
    ],
}


def run_seed(db: Session) -> None:
    if db.query(models.Concept).filter_by(subject=SUBJECT).first():
        print("Already seeded.")
        return

    concept_objs = {}
    for c in CONCEPTS:
        concept = models.Concept(subject=SUBJECT, **c)
        db.add(concept)
        db.flush()
        concept_objs[c["name"]] = concept

    n_questions = 0
    for concept_name, questions in QUESTIONS.items():
        concept = concept_objs[concept_name]
        for q in questions:
            db.add(models.Question(concept_id=concept.id, **q))
            n_questions += 1

    db.commit()
    print(f"Seeded {len(concept_objs)} concepts and {n_questions} questions.")
