# Bom Conselho - Class Council Management

System for managing class council meetings, generating records (Ata), and student performance reports.

## Local Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    -   No special configuration required for MVP.
    -   (Optional) Copy `.env.example` to `.env`.

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Deployment on Render (Recommended)

This application performs processing that benefits from a stable Node environment.
It acts as a **Web Service** that serves the static application.

### Web Service (Recommended for MVP)

1.  Create a new **Web Service** on Render.
2.  Connect your GitHub repository.
3.  **Environment**: Node
4.  **Build Command**:
    ```bash
    npm install && npm run build
    ```
5.  **Start Command**:
    ```bash
    npm start
    ```
    (This runs `serve -s dist`, which acts as the production server).
6.  **Environment Variables**:
    -   Render automatically sets `PORT`, which `npm start` will respect.
    -   No external database configuration is required for this version.

## Features

-   **Excel Import**: "Mapão" processing (Client-side).
-   **Reports**: PDF and DOCX generation for students and meetings (Client-side).
-   **Offline Capable**: Logic runs in the browser; data is session-based.
-   **Authentication**: Simple local authentication (Demo Mode).
    -   Default Credentials: `admin` / `admin`
