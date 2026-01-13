package dev.analyzer.models;

public class ParameterInfo {
    public String name;
    public String type;
    public String annotation;

    @Override
    public String toString() {
        return (annotation != null ? "@" + annotation + " " : "") + type + " " + name;
    }
}