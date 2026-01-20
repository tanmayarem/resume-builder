# AI Resume & Portfolio Builder (Groq + LLaMA 3)

A beginner-friendly web app that generates ATS-friendly resumes and cover letters using Groq’s LLaMA 3 model.

## Features
- Simple form: name, email, education, skills, projects, experience (optional).
- Generates ATS-friendly resume + short cover letter.
- Copy-to-clipboard buttons.
- Modern UI with responsive layout.

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- AI: Groq `llama-3.1-8b-instant`
- Env management: dotenv

## Prerequisites
- Node.js (LTS recommended)
- A Groq API key: https://console.groq.com/ (keep it private)

## Setup (local)
```bash
cd resume-builder
npm install
```

Create `.env` in the project root:
```
GROQ_API_KEY=your_groq_api_key_here
# PORT=3000
```

## Run
```bash
npm start
# open http://localhost:3000
```

## API
- `POST /generate-resume`
  - Body (JSON): `{ name, email, education, skills, projects, experience? }`
  - Returns: `{ resumeText, coverLetter, raw }`

## Tips
- Don’t commit `.env` (API key). `.gitignore` already covers it.
- If output looks truncated, check server logs and ensure `GROQ_API_KEY` is set.
- For a PDF, use browser “Print to PDF” or add a client-side export later.

## Project Structure
```
resume-builder/
├── server.js
├── package.json
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── .env              # not committed
```
