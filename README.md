# StudyGen AI – AI Study Notes Generator
**An Intelligent Educational SaaS Application Powered by Google Gemini AI**

---

## 1. Project Overview
StudyGen AI is an advanced study notes generator web application designed to help students, educators, and lifelong learners convert lengthy textbooks, research papers, and lecture transcripts into structured, digestible study notes instantly. Built with a literary Goodreads-inspired UI, it organizes reading materials into structured executive summaries, key takeaways, simplified explanations, and interactive practice quizzes.

---

## 2. Core Features & Capabilities
- **Intelligent Text Analysis**: Paste any educational content or textbook chapter with real-time character counting.
- **Executive Summaries**: AI-generated crystal-clear summaries explaining core concepts in understandable language.
- **Key Takeaways Extraction**: 5–10 structured bullet points highlighting critical definitions and principles.
- **Simplified Explanations (ELI5)**: Beginner-friendly analogies and breakdowns for complex theoretical topics.
- **Practice Quizzes & Active Recall**: 5 distinct practice questions complete with answers, explanations, Show/Hide toggles, and an **Interactive Quiz Mode**.
- **Study Shelves Management**: Organize notebooks across customized learning shelves ("Want to Study", "Currently Studying", "Mastered") with stable ID deduplication and local storage persistence.
- **Clipboard & Markdown Export**: One-click copying for all notes and markdown (`.md`) file downloads.

---

## 3. Application Workflow
1. The student opens the application.
2. The student pastes educational material into the study input workspace.
3. The student clicks the **Generate Notes** button.
4. The application sends the text payload securely to its Express backend.
5. The backend communicates with the Google Gemini API (`gemini-3.1-flash-lite`) using strict JSON schema validation.
6. Gemini processes the content and returns structured study notes.
7. The application displays the executive summary, key takeaways, simplified analogy, and practice quiz.
8. The student can review, copy, export, or save the notebook to their study shelves.

---

## 4. System Architecture
**System Workflow:**
$$\text{Student} \longrightarrow \text{Frontend UI (React, Tailwind CSS)} \longrightarrow \text{Express Backend API} \longrightarrow \text{Google Gemini API} \longrightarrow \text{Structured JSON Response} \longrightarrow \text{Frontend Display} \longrightarrow \text{Student}$$

---

## 5. Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js, Vite Middleware
- **AI Integration**: Google GenAI SDK (`@google/genai`), Model: `gemini-3.1-flash-lite` with structured `responseSchema`

---

## 6. Setup & Installation Instructions
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Configure your environment variables in `.env`:
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:3000`.
