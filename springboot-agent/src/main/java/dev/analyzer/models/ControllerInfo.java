package dev.analyzer.models;

import java.util.ArrayList;
import java.util.List;

public class ControllerInfo {
    public String className;
    public String basePath;
    public List<EndpointInfo> endpoints = new ArrayList<>();

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Controller: ").append(className).append("\n");
        sb.append("Base Path: ").append(basePath).append("\n");
        sb.append("Endpoints:\n");
        for (EndpointInfo e : endpoints) {
            sb.append("  ").append(e).append("\n");
        }
        return sb.toString();
    }
}