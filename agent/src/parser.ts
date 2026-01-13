import { exec } from "child_process";
import * as path from "path";
import * as fs from "fs";

const PARSER_PATH = path.join(__dirname, "..", "..", "springboot-agent");

export function parseProject(projectPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Update Main.java to use the uploaded project path
        const command = `cd "${PARSER_PATH}" && mvn exec:java -Dexec.mainClass="dev.analyzer.Main" -Dexec.args="${projectPath} ${outputPath}" -q`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("Parser error:", stderr);
                reject(error);
                return;
            }
            resolve();
        });
    });
}