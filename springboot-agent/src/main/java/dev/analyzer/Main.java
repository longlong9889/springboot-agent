package dev.analyzer;

import dev.analyzer.scanner.ProjectScanner;

import java.io.File;

public class Main {
    public static void main(String[] args) throws Exception {
        String projectPath;
        String outputPath;

        if (args.length >= 2) {
            projectPath = args[0];
            outputPath = args[1];
        } else {
            // Default paths for testing
            projectPath = "path/to/your/default/project";
            outputPath = "project-analysis.json";
        }

        File projectRoot = new File(projectPath);

        if (!projectRoot.exists()) {
            System.err.println("Project path does not exist: " + projectPath);
            System.exit(1);
        }

        ProjectScanner scanner = new ProjectScanner();
        scanner.scan(projectRoot);
        scanner.saveJson(outputPath);

        System.out.println("Analysis complete: " + outputPath);
    }
}