package dev.analyzer.models;

import java.util.List;

public class EndpointInfo {
    public String httpMethod;
    public String path;
    public String methodName;
    public String returnType;
    public List<ParameterInfo> parameters;

    @Override
    public String toString() {
        return httpMethod + " " + path + " -> " + methodName + "(" + parameters + ") : " + returnType;
    }
}