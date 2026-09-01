from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str  # "teacher" | "student"


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ConceptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    subject: str


class QuestionCreate(BaseModel):
    concept_id: int
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    difficulty: str = "medium"


class AnswerSubmit(BaseModel):
    student_id: int
    question_id: int
    selected_option: str
    mode: str = "adaptive"  # US-08 random baseline toggle
