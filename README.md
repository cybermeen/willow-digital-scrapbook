# Willow - A Digital Log for Everyday

## Project Overview

This repository contains the backend server for a journaling and task management web application.

The backend provides:

- User authentication with session-based login/logout
- Scrapbook / daily log management with photos, notes, prompts, stickers, and layout saving
- Todo list management with categorized tasks and completion toggling
- Image upload support and static serving of uploaded files

## Setup Instructions

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database
- Git (optional)

### Install dependencies

Open a terminal in the project root and run:

```bash
cd backend
npm install
```

### Configure environment variables

Create a `.env` file inside `backend` with the following variables:

```env
PORT=3000
SESSION_SECRET=your_session_secret
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
UPLOAD_PATH=./uploads
```

`UPLOAD_PATH` is optional. If omitted, uploads are stored in `backend/uploads` by default.

### Database setup

Create the PostgreSQL database and run the SQL schema file in `backend/db/schema.sql` if your app includes it.

If the project does not provide automated migrations, use your preferred database client to create the required tables.

### Start the server

From the `backend` folder run:

```bash
npm start
```

The server will start on the configured `PORT` (default: `3000`).

### Verify startup

Successful startup should show:

```text
🚀 Server running on port 3000
```

and a database connection confirmation:

```text
Connected to PostgreSQL successfully!
```

---

## Backend API Documentation

The detailed API documentation is located in `backend/README.md`.


## Uploads and static files

Uploaded files are saved to the `uploads` folder (or the path defined by `UPLOAD_PATH`).

- Uploaded files are served statically at: `http://localhost:3000/uploads/<filename>`
- Use `POST /api/scrapbook/photos/:logId` to upload image files.

