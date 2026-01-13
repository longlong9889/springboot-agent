package dev.analyzer.models;

import java.util.List;

public class MethodInfo {
    public String name;
    public String returnType;
    public List<ParameterInfo> parameters;

    @Override
    public String toString() {
        return name + "(" + parameters + ") : " + returnType;
    }
}