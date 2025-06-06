# 🚀 Mbotix Prompt Generator

**Mbotix Prompt Generator** is a full-stack AI prompt management platform that enables users to generate and save prompts for image or multimodal models. Built with **React** on the frontend and **Node.js + Express + MongoDB** on the backend, it integrates with **Azure OpenAI** to generate intelligent content. This project includes user authentication, admin controls, notifications, daily quotas, and a clean UI.

---

## ✨ Features

- 🔐 User authentication (JWT-based)
- 📄 Image & Veo prompt creation forms
- 📚 Prompt history view
- 🔔 Email and Telegram notification support
- 📊 Daily quota with auto-reset
- 🧑‍💼 Admin & user roles
- 🌐 Multi-language support (via i18n)
- ⚙️ Integration with Azure OpenAI
- 🎨 Clean and modern interface using Tailwind CSS

---

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer (email notifications)
- Azure OpenAI API
- node-cron (for automated tasks like quota resets)

### Frontend
- React + Vite
- Tailwind CSS
- React Router DOM
- i18next (multi-language support)

---

## 📁 Folder Structure

```

Mbotix-Prompt-Generator/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── assets/
│   ├── .env.example
│   └── package.json
|   └── and etc

````

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/MbotixTech/generate-prompt-ai.git
cd mbotix-prompt-generator
````

---

### 2. Setup the Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB, Azure OpenAI, email config, etc.
npm install
npm start
```

> Make sure MongoDB is running locally or on the cloud (e.g., MongoDB Atlas).

---

### 3. Setup the Frontend

```bash
cd ../frontend
cp .env.example .env
# Set VITE_API_URL to your backend URL (e.g., http://localhost:5000/api)
npm install
npm run dev
```

> App will be running at: `http://localhost:5173`

---

## 🔐 Environment Configuration

### Backend `.env` Example

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mbotix-prompt-generator
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
EMAIL_FROM="Mbotix Prompt <your_email@gmail.com>"

TELEGRAM_ENABLED=false
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id

ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend `.env` Example

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=MBOTIX Prompt Generator
```

---

## 📌 Usage Tips

* Create an account or log in as an admin
* Use the Image/Veo forms to generate prompts
* Access your prompt history anytime
* If enabled, receive notifications via email or Telegram
* Admin users can manage users

---

## 📊 Roadmap

* [ ] Add support for OpenAI's DALL·E or Gemini
* [ ] Automatic payment system for Pro subscriptions
* [ ] Social sharing for generated content

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤝 Contribution

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---
