# 🧠 BrainVector: Collaborative AI Workspace

**Status:** Core Backend Infrastructure Complete  
**Tech Stack:** NestJS, TypeScript, PostgreSQL, Redis  

---

## 🎯 Introduction

BrainVector is my attempt to **solve a real problem I faced**: modern knowledge work is fragmented. People edit documents in one tool, then switch to another to analyze or get insights. This context-switching slows down productivity.

BrainVector is a single workspace where users can:

- Write and collaborate on markdown-based documents in real-time  
- Chat with an AI about their own data (via LLM-powered RAG)  
- Work efficiently without waiting for slow responses  

I built this project because I wanted **speed, reliability, and simplicity**, not just features.

---

## 🏗️ Architecture & Thought Process

The backend is structured for **clarity and maintainability**:

| Component           | Technology          | Purpose |
|--------------------|------------------|---------|
| Backend Core        | NestJS (TypeScript) | Handles API requests, business logic, modular structure |
| Data Persistence    | PostgreSQL        | Stores users, workspaces, documents |
| Performance Layer   | Redis             | Cache frequent reads like user info and workspace lists |
| Real-Time Layer     | NestJS WebSockets | Planned: live document collaboration, notifications |
| AI Layer            | LLM / RAG         | Planned: answer questions from user-uploaded files |

I deliberately **kept it simple**, focusing on **one core flow at a time**: auth → workspace → caching. The goal was to make **each piece solid before adding complexity**.

---

## ✅ What’s Done

- **User Authentication:** Secure JWT with cookies, role-based access  
- **Workspaces:** Users can create and join workspaces; invitations are secure  
- **Caching with Redis:** Auth and workspace reads are cached, invalidation on writes  
- **Dockerized backend:** Easy setup for anyone to run locally  

> I focused on **performance, reliability, and developer experience** rather than piling on flashy features.

---

## 🛠️ Running Locally

1. Clone the repo and go inside: `git clone [Your-Repo-URL] && cd BrainVector`  
2. Install dependencies: `npm install`  
3. Copy `.env.example` to `.env` and update your secrets (`DATABASE_URL`, `JWT_SECRET`, `REDIS_HOST`, `REDIS_PORT`)  
4. Start services: `docker-compose up --build`  
5. Apply database migrations: `docker exec -it brainvector-backend npx prisma migrate dev`  
6. Open the app at `http://localhost:3000`

---

## 🧑‍💻 Development Workflow

- **Branching:** Every new feature has its own branch (`feature/new-doc-crud`)  
- **Commit Often:** Small commits with clear messages  
- **Merge Only After Testing:** Ensures stability  
- **Rebuild Docker After Core Changes:** Keeps environment consistent  

---

## 🌟 Key Learnings & Depth

- **Performance matters:** Caching user/workspace data reduced load dramatically  
- **Security is subtle but important:** JWT + cookies + roles  
- **Simplicity over complexity:** One clean flow > many half-baked features  
- **Docker makes life easier:** Anyone can run a full environment with one command  

This project is **a work in progress**, but the foundation is strong. The next steps are building real-time collaboration and connecting the LLM layer — but **I prefer a strong base first rather than rushing features**.

---

## ✨ Made With Passion

This project is built thoughtfully, one step at a time, focusing on **real problems, solid foundations, and practical solutions**.  

If you like what you see or want to collaborate, feel free to **contact me at**: **arunkoo072@gmail.com**  
I’d love to hear your feedback, ideas, or opportunities to work together.
