# Full-Stack Real-Time Confessions Platform

> A comprehensive full-stack application built to master ASP.NET Core and React.js, focusing on real-time communication, robust authentication, and complex database relationships.

---

## 🎯 Motivation
This project serves as a technical sandbox to bridge the gap between simple CRUD apps and production-grade software engineering. The goal was to implement:
* **Real-time WebSockets** using SignalR.
* **Third-party Identity Management** with Auth0.
* **Complex Data Modeling** using self-referencing tables for threaded discussions.

---

## 🚀 Features

### 👤 User Features
* **Anonymous Confessions:** Post thoughts and feelings anonymously.
* **Threaded Conversations:** Reply to confessions and specific replies using nested logic.
* **Real-Time Notifications:** Push notifications sent via SignalR when users interact with your threads.
* **Responsive UI:** Fully themed experience with **Dark Mode** support.

### 🛠️ Admin Panel (Material UI)
* **Heat Map Calendar:** Visualize reporting frequency using a GitHub-style activity map.
* **Advanced Moderation:** Filter, search, and manage reported records with multiple parameters.
* **Content Control:** Delete/deactivate threads; once deactivated, all further interaction is disabled.
* **Auth0 Integration:** Direct visibility into Auth0 users and Role-Based Access Control (RBAC).

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js, Material UI, Bootstrap |
| **Backend** | ASP.NET Core Web API, SignalR |
| **Database** | PostgreSQL, Entity Framework Core |
| **Authentication** | Auth0 (JWT & RBAC) |

---

## 🧠 What I Learned

* **Real-Time Sync:** Managing data consistency between WebSocket (SignalR) streams and standard RESTful API fetches.
* **Advanced EF Core:** Implementing **Self-Referencing Tables** to allow for infinite threading in comments.
* **Security & Auth:** Configuring JWT validation within ASP.NET controllers and implementing RBAC via Auth0.
* **Architecture:** Using **Dependency Injection** to create reusable services (e.g., Auth0 Role Server) and helper methods to keep controllers lean.
* **Performance:** Implementing effective polling and pagination to handle large datasets.
* **State Management:** Utilizing the React **Context Hook** to share global variables and themes across the component tree.
* **Git Workflow:** Managing professional branch merging and proper `.gitignore` configuration (ignoring static assets and migration binaries).

---
## 🚀 Getting Started

Follow these steps to set up the project locally.

### 📋 Prerequisites
* **.NET SDK** (Latest version recommended)
* **Node.js & npm**
* **PostgreSQL**
* **EF Core Tools**: Install via `dotnet tool install --global dotnet-ef`

---

### 🛠️ Installation & Setup

## 📂 Project Structure

```text
├── Server      # ASP.NET Core Web API (Business Logic & SignalR)
├── Client      # React.js Frontend (UI & State Management)
└── AppHost     # Project Orchestration & Configuration




#### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/your-project.git](https://github.com/your-username/your-project.git)
cd your-project
