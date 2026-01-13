package dev.analyzer.models;

import java.util.ArrayList;
import java.util.List;

public class RepositoryInfo {
    public String interfaceName;
    public String entityType;
    public String idType;
    public List<MethodInfo> customMethods = new ArrayList<>();

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Repository: ").append(interfaceName).append("\n");
        sb.append("Entity: ").append(entityType).append("\n");
        sb.append("ID Type: ").append(idType).append("\n");
        sb.append("Custom Methods:\n");
        for (MethodInfo m : customMethods) {
            sb.append("  ").append(m).append("\n");
        }
        return sb.toString();
    }
}