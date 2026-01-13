import OpenAI from "openai";
import { tools, executeTool } from "./tools";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful assistant that answers questions about a Spring Boot codebase.

You have access to tools that let you explore the codebase:
- list_endpoints: See all API endpoints
- get_controller_info: Get details about a controller
- get_service_info: Get details about a service
- get_repository_info: Get details about a repository
- get_entity_info: Get details about an entity/model
- trace_endpoint: Trace the flow from controller to database
- get_project_summary: Get a high-level overview

Use these tools to answer questions accurately. Always base your answers on the actual codebase data, not assumptions.

When explaining code flow, be clear and concise. Use the trace_endpoint tool to show how requests flow through the application.`;

export async function chat(userMessage: string): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
    ];

    // First call - let the model decide if it needs tools
    let response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools,
    });

    let assistantMessage = response.choices[0].message;

    // Loop while the model wants to use tools
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Add assistant's message with tool calls
        messages.push(assistantMessage);

        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
            if (toolCall.type !== "function") continue;

            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);

            console.log(`\n🔧 Using tool: ${toolName}`);
            console.log(`   Args: ${JSON.stringify(toolArgs)}`);

            const toolResult = executeTool(toolName, toolArgs);

            console.log(`   Result preview: ${toolResult.substring(0, 100)}...`);

            // Add tool result to messages
            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: toolResult,
            });
        }

        // Call the model again with tool results
        response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            tools,
        });

        assistantMessage = response.choices[0].message;
    }

    return assistantMessage.content || "I couldn't generate a response.";
}