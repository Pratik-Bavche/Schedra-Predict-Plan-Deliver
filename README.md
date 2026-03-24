# Schedra : AI-Powered Project Management & Scheduling Platform

Schedra is an advanced project management platform that leverages Generative AI to predict project outcomes, assess risks, and optimize delivery timelines. It moves beyond simple task tracking to provide actionable intelligence for project managers. 

## 🚀 Key Features

*   **AI-Driven Forecasting:** Predict cost overruns and timeline delays using machine learning models (powered by Gemini AI and statistical algorithms).
*   **Risk Heatmaps:** Visualize potential failure points and resource bottlenecks with dynamic heatmaps.
*   **Smart Analytics Dashboard:** Real-time insights into project health, budget variance, and team utilization.
*   **Interactive Simulation:** Run "What-If" scenarios (e.g., weather impact, material inflation) to see how they affect project delivery.
*   **Project Management:** Comprehensive CRUD operations for managing projects, deadlines, and budgets.
*   **Responsive Design:** Fully optimized interface for desktop, tablet, and mobile devices.

## 🛠️ Technology Stack

### Frontend
*   **Framework:** [React](https://react.dev/) (Vite)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Visualization:** [Recharts](https://recharts.org/) for analytics and charts.
*   **State Management:** React Hooks.

### Backend
*   **Runtime:** [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
*   **Database:** [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
*   **AI Integration:** [Google Generative AI (Gemini)](https://ai.google.dev/)
*   **Security:** CORS configuration, Environment variable management.

### Deployment
*   **Platform:** Vercel (Frontend & Backend)
*   **Architecture:** Serverless functions for API endpoints.

## ⚙️ Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/schedra.git
    cd schedra
    ```

2.  **Backend Setup**
    ```bash
    cd server
    npm install
    ```
    *   Create a `.env` file in the `server` directory:
        ```env
        PORT=5000
        MONGO_URI=your_mongodb_connection_string
        GEMINI_API_KEY=your_google_gemini_api_key
        ```
    *   Start the server:
        ```bash
        node server.js
        ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    ```
    *   The frontend automatically detects whether it's running locally (`localhost:5000`) or in production.
    *   Start the development server:
        ```bash
        npm run dev
        ```

## 🌍 Deployment

This project is configured for seamless deployment on **Vercel**.

1.  **Push to GitHub.**
2.  **Import into Vercel.**
3.  **Configure Environment Variables** in Vercel project settings (`MONGO_URI`, `GEMINI_API_KEY`).
4.  **Deploy.** The `vercel.json` and `server.js` are pre-configured to handle serverless function exports and CORS automatically.

Live Link : https://schedra-predict-plan-deliver-client.vercel.app

