# EduVision AI Platform

## Project Overview

EduVision AI Platform is an AI-powered educational system designed to help students and learners understand complex educational content more efficiently. The platform integrates Artificial Intelligence with modern web technologies to provide intelligent tools such as AI-based text summarization, user authentication, and a user-friendly dashboard.

The system allows users to input large amounts of text and receive concise summaries generated using Natural Language Processing (NLP) models. This helps students save time and improve learning productivity.

The platform is built using modern technologies including React, Vite, TailwindCSS, and Axios, with AI models integrated through backend APIs.

---

# Key Features

## AI Text Summarization

The platform provides an AI-powered summarization tool that converts long academic or educational content into short and meaningful summaries. This allows students to quickly grasp key ideas without reading lengthy documents.

Features include:

- Automatic text summarization  
- Fast response using AI APIs  
- Improved comprehension of educational materials  

---

## User Authentication System

A secure authentication system ensures that only authorized users can access the platform.

Capabilities include:

- User login and registration  
- Token-based authentication  
- Refresh token mechanism  
- Secure session handling  

---

## Interactive User Dashboard

The dashboard provides a central interface where users can access all platform features.

Dashboard functions include:

- Access to AI summarization tools  
- User account management  
- Platform navigation  

---

## Responsive User Interface

The platform is designed with a modern responsive interface that works across multiple devices.

UI characteristics include:

- Mobile-friendly design  
- Fast loading performance  
- Clean and intuitive layout  
- Built using TailwindCSS  

---

# System Architecture

EduVision AI Platform follows a **client-server architecture**.
<img width="2752" height="3266" alt="mermaid-diagram" src="https://github.com/user-attachments/assets/5ea6631d-7128-4f05-bd77-a7561fbc2024" />

Workflow:

User  
⬇  
Frontend Application (React + Vite)  
⬇  
API Services (Axios)  
⬇  
Backend AI Services  
⬇  
AI Model Processing  

---

## Core Components

### Frontend Layer

The frontend is responsible for user interaction and interface rendering.

Technologies used:

- React  
- Vite  
- TailwindCSS  
- React Router  

Responsibilities:

- User interface  
- Routing and navigation  
- API integration  
- Dashboard display  

---

### Service Layer

The service layer manages communication between the frontend and backend.

Services include:

- Authentication Services  
- Dashboard Services  
- AI Summarization Services  

Responsibilities:

- API calls using Axios  
- Token management  
- Data fetching and updates  

---

### AI Backend Layer

The backend handles AI model inference and data processing.

Responsibilities include:

- Running NLP models  
- Processing input text  
- Generating summaries  
- Returning responses to the frontend  

---

# Project Directory Structure

```
EduVision-AI-Platform
│
├── AiUser
│   ├── public
│   │   ├── favicon.png
│   │   └── 404.html
│   │
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── routes
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── services
│   │   ├── Auth
│   │   │   ├── authAxios.js
│   │   │   └── authServices.js
│   │   │
│   │   ├── Dash
│   │   │   ├── dashAxios.js
│   │   │   └── dashServices.js
│   │   │
│   │   └── Summarizer
│   │       ├── summarizeAxios.js
│   │       └── summarizeServices.js
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

---

# Technologies Used

## Frontend Technologies

- React  
- Vite  
- TailwindCSS  
- React Router  
- Axios  

---

## Development Tools

- ESLint  
- PostCSS  
- Vite Dev Server  
- Node.js  

---

## Artificial Intelligence Technologies

- Natural Language Processing (NLP)  
- Text Summarization Models  
- Transformer-based Models  

Examples of models:

- BERT  
- GPT  
- T5  
- BART  

---

# Installation Guide

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/EduVision-AI-Platform.git
```

## Step 2: Navigate to Project Folder

```bash
cd EduVision-AI-Platform/AiUser
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run the Development Server

```bash
npm run dev
```

## Step 5: Build for Production

```bash
npm run build
```

---

# Pre-Training

Pre-training refers to the process of training a machine learning model on a large general dataset before adapting it to a specific task.

For the EduVision AI summarization system, pre-training may involve training models on large datasets such as:

- Wikipedia  
- BooksCorpus  
- Common Crawl  
- Web-based datasets  

During pre-training, the model learns:

- Grammar and sentence structure  
- Language patterns  
- Contextual relationships  
- Semantic understanding  

Popular pre-trained NLP models include:

- BERT (Bidirectional Encoder Representations from Transformers)  
- GPT (Generative Pre-trained Transformer)  
- T5 (Text-To-Text Transfer Transformer)  
- BART (Bidirectional and Auto-Regressive Transformer)  

---

# Fine-Tuning

Fine-tuning adapts a pre-trained model for a specific domain or task.

In the EduVision AI Platform, the summarization model can be fine-tuned using educational content such as:

- Academic papers  
- Lecture notes  
- Study materials  
- Educational articles  

Fine-tuning steps include:

1. Collect domain-specific datasets  
2. Clean and preprocess the text  
3. Tokenize input text using NLP tokenizers  
4. Train the model using input-summary pairs  
5. Optimize model parameters  

Example training data format:

Input Text → Target Summary

Fine-tuning improves:

- Summary accuracy  
- Context relevance  
- Domain-specific understanding  

---

# Model Evaluation

Evaluation measures the performance and quality of the AI summarization model.

## ROUGE Score

ROUGE measures overlap between generated summaries and reference summaries.

- ROUGE-1 – unigram overlap  
- ROUGE-2 – bigram overlap  
- ROUGE-L – longest common subsequence  

---

## BLEU Score

BLEU evaluates similarity between generated text and reference text.

---

## Human Evaluation

Human reviewers assess:

- Accuracy  
- Readability  
- Coherence  
- Coverage of key information  

---

# API Communication

The platform uses Axios for API communication.

Axios handles:

- HTTP requests  
- Authorization headers  
- Token refresh  
- Error handling  

Services implemented include:

- Authentication Service  
- Dashboard Service  
- Summarization Service  

---

# Security Features

The platform implements several security mechanisms.

These include:

- Token-based authentication  
- Refresh token mechanism  
- Protected routes  
- Secure API communication  
- Session management  

---

# Future Improvements

The EduVision AI Platform can be expanded with additional AI features such as:

- AI-powered question answering system  
- Intelligent tutoring assistant  
- Voice-based learning interface  
- Personalized learning recommendations  
- Multi-language summarization  
- AI study planner  
- Learning analytics dashboard  

---

# Contributors

EduVision AI Platform was developed as part of an AI-based educational technology initiative.

Contributors may include:

- Frontend Developers  
- Backend Engineers  
- AI/ML Engineers  
- Data Scientists  

---

# License

This project is licensed under the **MIT License**.

You are free to use, modify, and distribute this project with proper attribution.

---

# Conclusion

EduVision AI Platform demonstrates how Artificial Intelligence can enhance modern education by providing intelligent learning tools. The system combines AI models with scalable web technologies to deliver a powerful educational platform capable of simplifying complex learning materials.
