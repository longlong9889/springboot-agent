import * as dotenv from "dotenv";
dotenv.config();

import * as readline from "readline";
import { chat } from "./agent";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.log("🚀 Spring Boot Analyzer Agent");
console.log("Ask questions about your codebase. Type 'exit' to quit.\n");

function prompt() {
    rl.question("You: ", async (input) => {
        const userInput = input.trim();

        if (userInput.toLowerCase() === "exit") {
            console.log("Goodbye!");
            rl.close();
            return;
        }

        if (!userInput) {
            prompt();
            return;
        }

        try {
            console.log("\nThinking...\n");
            const response = await chat(userInput);
            console.log(`\nAssistant: ${response}\n`);
        } catch (error) {
            console.error("Error:", error);
        }

        prompt();
    });
}

prompt();