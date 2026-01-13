package dev.analyzer.models;

import java.util.ArrayList;
import java.util.List;

public class ServiceInfo {
    public String className;
    public List<DependencyInfo> dependencies = new ArrayList<>();
    public List<MethodInfo> methods = new ArrayList<>();

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Service: ").append(className).append("\n");
        sb.append("Dependencies:\n");
        for (DependencyInfo d : dependencies) {
            sb.append("  ").append(d).append("\n");
        }
        sb.append("Methods:\n");
        for (MethodInfo m : methods) {
            sb.append("  ").append(m).append("\n");
        }
        return sb.toString();
    }
}