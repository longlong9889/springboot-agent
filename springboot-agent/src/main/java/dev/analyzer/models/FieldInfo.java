package dev.analyzer.models;

import java.util.ArrayList;
import java.util.List;

public class FieldInfo {
    public String name;
    public String type;
    public List<String> annotations = new ArrayList<>();

    @Override
    public String toString() {
        String anns = annotations.isEmpty() ? "" : annotations + " ";
        return anns + type + " " + name;
    }
}
