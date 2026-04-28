# Willow — A Digital Log for Everyday

Willow is a personal, daily-use web application that combines productivity with creativity. It lets users manage tasks in a light, gamified way while also offering a space to capture moments from their day through a digital scrapbook-style log. Rather than focusing strictly on productivity or mindfulness, Willow aims to create a positive and enjoyable experience that users are motivated to return to daily.

---

## Features

### Workflow 1 — User Onboarding & Authentication + Daily Planning & Task Management
Secure account creation, authentication, and session-based login/logout management. Includes credential validation and a personalized dashboard upon login. Also features comprehensive to-do list functionality allowing users to create, view, edit, and complete tasks. Tasks are categorized by timeframe (**Today**, **This Week**, **Upcoming**) and support priority levels. Completed tasks are visually distinguished.

### Workflow 2 — Streaks, Rewards & Achievements
A gamification layer that tracks daily streaks, awards rewards, and unlocks exclusive stickers and other incentives when users complete their daily tasks.

### Workflow 3 — Daily Log Scrapbooking
A digital canvas for users to record and decorate moments from their day:

- **Photos** — Upload and freely position images on the daily canvas
- **Reflective Prompts** — Answer short, randomized daily prompts to encourage reflection
- **Art Assets & Stickers** — Decorate logs with an unlocked ,agic library of stickers
- **Layout Customization** — Flexible, draggable arrangement that saves exact coordinates (x/y, rotation, z-index) of all canvas elements
- **Achievements** — Unlock exclusive stickers and rewards by completing all daily tasks

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Backend Environment | Node.js |
| Backend Framework | Express.js |
| Database | PostgreSQL |
| Password Security | `bcrypt` |
| Session Management | `express-session` |
| File Uploads | `multer` |
| DB Client | `pg` |
| Config | `dotenv` |

---

## Setup & Installation

### Prerequisites
- **Node.js** v18+
- **PostgreSQL** installed and running locally

### 1. Clone the Repository
```bash
git clone https://github.com/cybermeen/willow-digital-scrapbook
cd willow-digital-scrapbook
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
Create a `.env` file inside the `backend` directory:
```env
PORT=3000
SESSION_SECRET=your_super_secret_session_key
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
UPLOAD_PATH=./uploads
```

### 4. Set Up the Database
1. Open your PostgreSQL client (e.g., `psql`, pgAdmin) and create a database matching your `DB_NAME`:
   ```sql
   CREATE DATABASE willow_db;
   ```
2. Run the schema file to generate all required tables:
   ```bash
   psql -U your_postgres_username -d your_db_name -f backend/db/schema.sql
   ```
3. Seed the database with default prompts and art assets:
   ```bash
   node seed.js
   ```

### 5. Run the server
```bash
npm start
```

The server will start on the configured port. You should see:
```
Server running on port 5000
Connected to PostgreSQL successfully!
```
### 6. Run the frontend
```bash
cd frontend
npm install
npm start
```
---

##  Team Contributions

### Aabeerah Iqbal
- **Workflow 1 — User Authentication + Daily Planning & Task Management:** Developed the secure user authentication system, including registration, credential validation, password hashing with bcrypt, and session-based login/logout flows. Also engineered the task tracking system, including the database schema, API routes for creating/editing/deleting tasks, and categorization logic (Today, This Week, Upcoming, Completed).
- **Workflow 2 — Streaks, Rewards & Achievements:** Built the gamification layer of the application, including streak tracking, reward logic, and the achievements system that unlocks exclusive stickers and other incentives upon completing daily tasks.

### Zarmeen Rahman
- **Workflow 3 — Daily Log Scrapbooking:** Architected and implemented the digital scrapbook feature. Built backend support for photo uploads via `multer`, reflective prompt generation, note-taking, sticker placements, and layout-saving endpoints that persist absolute positional data (x/y coordinates, rotation, z-index) for all canvas elements.
