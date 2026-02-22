# Spring Boot Analyzer

An LLM-powered tool that helps developers understand Spring Boot codebases through natural language questions.

## Features

- Upload any Spring Boot project (.zip)
- Ask natural language questions about your codebase
- Trace request flows from controller to database
- Explore endpoints, services, repositories, and entities

## Demo

[Live Demo](https://springboot-agent.vercel.app/)

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, OpenAI API
- **Parser:** TypeScript (also available in Java)

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

1. Clone the repo
```bash
   git clone https://github.com/longlong9889/springboot-agent.git
   cd springboot-agent
```

2. Start the backend
```bash
   cd agent
   npm install
   echo "OPENAI_API_KEY=your-key" > .env
   npm run server
```

3. Start the frontend
```bash
   cd frontend
   npm install
   npm run dev
```

4. Open http://localhost:5173

## How It Works

1. User uploads a Spring Boot project
2. Parser extracts controllers, services, repositories, and entities
3. LLM agent uses custom tools to answer questions about the codebase

## Example Questions

- "What endpoints does this app have?"
- "Tell me about the UserController"
- "How do users send messages?"
- "Trace GET /api/v1/items/{itemId}"

## License

MIT
