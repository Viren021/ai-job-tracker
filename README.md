# 🚀 AI Job Tracker & Intelligent Career Agent

![AI Job Tracker Banner](https://via.placeholder.com/1200x300?text=AI+Job+Tracker+Project)

> **A Full-Stack Career Assistant powered by Gemini 2.5 Flash.**
> Automatically finds jobs, parses your resume, scores job matches using AI, and lets you chat with a Career Agent to filter roles.

🔗 **Live Demo:** [Click Here to Visit App](https://ai-job-tracker-client.vercel.app/)  
🔗 **Backend API:** [View API Status](https://ai-job-tracker-api-e85o.onrender.com/)

---

## 🏗️ Architecture Diagram

Here is the high-level architecture of the system, showing how the Frontend (React) communicates with the Backend (Fastify) and external AI services.

![System Architecture](https://github.com/user-attachments/assets/4ba1a8d1-3dc9-4eea-a6fc-911878516875)

> *The system uses a resilient architecture where Redis is optional—ensuring the app runs smoothly even in limited deployment environments.*

---

## ✨ Key Features

-   **📄 Smart Resume Parsing:** Upload a PDF resume; the system extracts text and skills automatically.
-   **🤖 AI Match Scoring:** Uses **Google Gemini 2.5** to compare your resume against job descriptions and assign a 0-100 match score.
-   **💬 AI Career Agent:** A LangGraph-powered chat agent that can search for jobs, filter results (Remote, Internship), and summarize your applications.
-   **🌍 Job Scraping:** Aggregates real jobs from external sources (Adzuna/APIs).
-   **🛡️ Resilient Backend:** Built with a "Crash-Proof" Redis fallback mechanism (switches to Database-only mode if Redis fails).

---

## 🛠️ Tech Stack

### **Frontend**
* ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) **React + Vite**
* ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) **Tailwind CSS**
* **Lucide React** (Icons)

### **Backend**
* ![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) **Node.js (Fastify Framework)**
* ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) **PostgreSQL (Supabase)**
* ![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white) **Prisma ORM**
* **Redis** (Caching - Optional/Safe Mode)

### **AI & Logic**
* ![Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google%20bard&logoColor=white) **Gemini 2.5 Flash**
* 🦜🔗 **LangChain & LangGraph**

---

## 🚀 Getting Started Locally

Follow these steps to run the project on your local machine.

### 1. Clone the Repository
```bash
git clone https://github.com/Viren021/ai-job-tracker.git
cd ai-job-tracker
```

### 2. Backend Setup (`server/`)
```bash
cd server
npm install

# Create a .env file
cp .env.example .env

# Run Database Migrations
npx prisma migrate dev --name init

# Start Server
npm start
```

### 3. Frontend Setup (`client/`)
```bash
cd client
npm install

# Start Frontend
npm run dev
```

---

## 🔑 Environment Variables (`.env`)

Create a `.env` file in the `server` folder with the following:

```env
DATABASE_URL="postgresql://user:password@host:5432/db"
GOOGLE_API_KEY="your_gemini_api_key"
ADZUNA_APP_ID="your_adzuna_id"
ADZUNA_APP_KEY="your_adzuna_key"
REDIS_URL="redis://..." (Optional)
```

---

## 📬 Contact

Created by **Viren** | [GitHub](https://github.com/Viren021) | [LinkedIn](https://www.linkedin.com/in/viren-hadawale-0v21/)
