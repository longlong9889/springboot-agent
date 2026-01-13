# Spring Boot Analyzer

An LLM-powered tool that helps developers understand Spring Boot codebases through natural language queries.

## Features

- Upload any Spring Boot project (.zip)
- Ask natural language questions about the codebase
- Trace request flows from controller to database
- View all endpoints, services, repositories, and entities

## Tech Stack

- **Parser**: Java + JavaParser
- **Backend**: Node.js + Express + OpenAI API
- **Frontend**: React + TypeScript

## Getting Started

### Prerequisites

- Java 17+
- Node.js 18+
- OpenAI API key

### Setup

1. Build the parser:
```bash
   cd parser
   mvn clean package -q
```

2. Start the backend:
```bash
   cd agent
   npm install
   echo "OPENAI_API_KEY=your-key" > .env
   npm run server
```

3. Start the frontend:
```bash
   cd frontend
   npm install
   npm run dev
```

4. Open http://localhost:5173

## How It Works

1. User uploads a Spring Boot project
2. Java parser extracts controllers, services, repositories, and entities
3. LLM agent uses custom tools to answer questions about the codebase

## License

MIT