package dev.analyzer.models;

public class DependencyInfo {
    public String type;
    public String name;

    @Override
    public String toString() {
        return type + " " + name;
    }
}