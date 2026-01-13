import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

interface Message {
    role: "user" | "assistant";
    content: string;
}

function App() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [projectName, setProjectName] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessages([]);

        const formData = new FormData();
        formData.append("project", file);

        try {
            const response = await axios.post("http://localhost:3001/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setSessionId(response.data.sessionId);
            setProjectName(file.name.replace(".zip", ""));
            setMessages([
                {
                    role: "assistant",
                    content: `✅ Project "${file.name}" uploaded and analyzed successfully!\n\nYou can now ask questions about your codebase. Try:\n• "What endpoints does this app have?"\n• "Tell me about the controllers"\n• "How does the authentication work?"`,
                },
            ]);
        } catch (error) {
            setMessages([
                {
                    role: "assistant",
                    content: "❌ Failed to upload project. Make sure it's a valid Spring Boot project in a .zip file.",
                },
            ]);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            const response = await axios.post("http://localhost:3001/api/chat", {
                message: userMessage,
                sessionId,
            });

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: response.data.response },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, something went wrong. Please try again." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="app">
            <header className="header">
                <h1>🍃 Spring Boot Analyzer</h1>
                <p>
                    {projectName
                        ? `Analyzing: ${projectName}`
                        : "Upload a Spring Boot project to get started"}
                </p>
                <div className="upload-section">
                    <input
                        type="file"
                        accept=".zip"
                        onChange={handleUpload}
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="upload-button">
                        {uploading ? "Analyzing..." : "📁 Upload Project (.zip)"}
                    </label>
                </div>
            </header>

            <div className="chat-container">
                <div className="messages">
                    {messages.length === 0 && !projectName && (
                        <div className="welcome">
                            <h2>Welcome!</h2>
                            <p>Upload your Spring Boot project as a .zip file to get started.</p>
                            <p className="hint">
                                The zip should contain your project with src/main/java folder.
                            </p>
                        </div>
                    )}

                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role}`}>
                            <div className="message-content">
                                {msg.content.split("\n").map((line, i) => (
                                    <span key={i}>
                    {line}
                                        <br />
                  </span>
                                ))}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="message assistant">
                            <div className="message-content loading">Thinking...</div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="input-container">
          <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                  projectName
                      ? "Ask a question about the codebase..."
                      : "Upload a project first..."
              }
              rows={1}
              disabled={loading || !projectName}
          />
                    <button onClick={sendMessage} disabled={loading || !input.trim() || !projectName}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;