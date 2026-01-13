package dev.analyzer.scanner;

import dev.analyzer.extractors.ControllerExtractor;
import dev.analyzer.extractors.EntityExtractor;
import dev.analyzer.extractors.RepositoryExtractor;
import dev.analyzer.extractors.ServiceExtractor;
import dev.analyzer.models.ControllerInfo;
import dev.analyzer.models.EntityInfo;
import dev.analyzer.models.RepositoryInfo;
import dev.analyzer.models.ServiceInfo;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.FileWriter;

public class ProjectScanner {

    private List<ControllerInfo> controllers = new ArrayList<>();
    private List<ServiceInfo> services = new ArrayList<>();
    private List<RepositoryInfo> repositories = new ArrayList<>();
    private List<EntityInfo> entities = new ArrayList<>();

    public void scan(File projectRoot) throws Exception {
        List<File> javaFiles = findJavaFiles(projectRoot);

        for (File file : javaFiles) {
            String content = Files.readString(file.toPath());

            try {
                if (isController(content)) {
                    ControllerInfo info = ControllerExtractor.extract(file);
                    if (info.className != null) {
                        controllers.add(info);
                    }
                } else if (isService(content)) {
                    ServiceInfo info = ServiceExtractor.extract(file);
                    if (info.className != null) {
                        services.add(info);
                    }
                } else if (isRepository(content)) {
                    RepositoryInfo info = RepositoryExtractor.extract(file);
                    if (info.interfaceName != null) {
                        repositories.add(info);
                    }
                } else if (isEntity(content)) {
                    EntityInfo info = EntityExtractor.extract(file);
                    if (info.className != null) {
                        entities.add(info);
                    }
                }
            } catch (Exception e) {
                System.err.println("Error parsing: " + file.getName() + " - " + e.getMessage());
            }
        }
    }

    private List<File> findJavaFiles(File root) throws IOException {
        List<File> javaFiles = new ArrayList<>();

        try (Stream<Path> paths = Files.walk(root.toPath())) {
            paths.filter(p -> p.toString().endsWith(".java"))
                    .filter(p -> !p.toString().contains("test"))
                    .filter(p -> !p.toString().contains("Test"))
                    .forEach(p -> javaFiles.add(p.toFile()));
        }

        return javaFiles;
    }

    private boolean isController(String content) {
        return content.contains("@RestController") || content.contains("@Controller");
    }

    private boolean isService(String content) {
        return content.contains("@Service");
    }

    private boolean isRepository(String content) {
        return content.contains("@Repository")
                || content.contains("extends JpaRepository")
                || content.contains("extends CrudRepository");
    }

    private boolean isEntity(String content) {
        return content.contains("@Entity");
    }

    public List<ControllerInfo> getControllers() {
        return controllers;
    }

    public List<ServiceInfo> getServices() {
        return services;
    }

    public List<RepositoryInfo> getRepositories() {
        return repositories;
    }

    public List<EntityInfo> getEntities() {
        return entities;
    }

    public void printSummary() {
        System.out.println("=== PROJECT SUMMARY ===\n");

        System.out.println("CONTROLLERS (" + controllers.size() + "):");
        for (ControllerInfo c : controllers) {
            System.out.println(c);
        }

        System.out.println("SERVICES (" + services.size() + "):");
        for (ServiceInfo s : services) {
            System.out.println(s);
        }

        System.out.println("REPOSITORIES (" + repositories.size() + "):");
        for (RepositoryInfo r : repositories) {
            System.out.println(r);
        }

        System.out.println("ENTITIES (" + entities.size() + "):");
        for (EntityInfo e : entities) {
            System.out.println(e);
        }
    }
    public String toJson() {
        ProjectOutput output = new ProjectOutput(
                controllers,
                services,
                repositories,
                entities
        );

        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        return gson.toJson(output);
    }

    public void saveJson(String filePath) throws IOException {
        String json = toJson();
        try (FileWriter writer = new FileWriter(filePath)) {
            writer.write(json);
        }
        System.out.println("Saved to: " + filePath);
    }
}