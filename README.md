# AI Resume Analyzer & Job Match Scoring System

An AI-powered full-stack application that analyzes resumes, scores them for ATS (Applicant Tracking System) compatibility, matches them against job descriptions, and generates tailored interview questions.



## ✨ Features

- **Resume Upload & Parsing** — supports PDF, Word (.doc/.docx), and image files (with OCR via Tesseract.js)
- **ATS Scoring** — evaluates resumes for applicant tracking system compatibility
- **Job Match Scoring** — compares resume content against job descriptions to generate a fit score
- **AI Interview Question Generation** — generates tailored interview questions using Groq/OpenAI
- **Recruiter Dashboard** — lets recruiters view and rank uploaded resumes
- **Authentication** — session-based signup/login system

## 🛠️ Tech Stack

**Frontend**
- React 19 + React Router v7
- Tailwind CSS
- Zustand (state management)
- Vite

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose
- Express Session + connect-mongo
- Multer (file uploads)
- Tesseract.js (OCR)
- pdf-parse, mammoth (document parsing)
- Groq / OpenAI SDK (AI interview questions)

**Deployment**
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## 📁 Project Structure
ai-resume-analyzer/
├── backend/
│ ├── server.js
│ ├── package.json
│ └── .env.example
├── frontend/
│ ├── app/
│ │ ├── components/
│ │ ├── routes/
│ │ └── lib/
│ ├── package.json
│ └── Dockerfile

## 🚀 Running Locally

**Backend**
```bash
cd backend
npm install
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Log in |
| POST | `/api/candidate/upload` | Upload a resume |
| GET | `/api/candidate/resumes` | Get uploaded resumes |
| GET | `/api/candidate/analyze/:id` | Get AI analysis for a resume |
| GET | `/api/recruiter/resumes` | Recruiter view of resumes |
| POST | `/api/recruiter/rank` | Rank resumes for a job description |
| GET | `/api/health` | Health check |

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

## 👤 Author

**Devika B**
[GitHub](https://github.com/deboneshe123)
