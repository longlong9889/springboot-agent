package dev.analyzer.extractors;

import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.expr.AnnotationExpr;
import com.github.javaparser.ast.expr.MemberValuePair;
import dev.analyzer.models.ControllerInfo;
import dev.analyzer.models.EndpointInfo;
import dev.analyzer.models.ParameterInfo;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class ControllerExtractor {

    static {
        // Configure JavaParser to support modern Java features (records, etc.)
        StaticJavaParser.getConfiguration().setLanguageLevel(ParserConfiguration.LanguageLevel.JAVA_17);
    }

    public static void main(String[] args) throws Exception {
        File file = new File("path/to/YourController.java");
        ControllerInfo info = extract(file);
        System.out.println(info);
    }

    public static ControllerInfo extract(File file) throws Exception {
        CompilationUnit cu = StaticJavaParser.parse(file);

        ControllerInfo info = new ControllerInfo();

        cu.findAll(ClassOrInterfaceDeclaration.class).forEach(clazz -> {
            // Check if it's a controller
            boolean isController = clazz.getAnnotations().stream()
                    .anyMatch(a -> a.getNameAsString().equals("RestController")
                            || a.getNameAsString().equals("Controller"));

            if (!isController) return;

            info.className = clazz.getNameAsString();
            info.basePath = extractClassLevelPath(clazz);

            // Extract endpoints from methods
            clazz.getMethods().forEach(method -> {
                EndpointInfo endpoint = extractEndpoint(method);
                if (endpoint != null) {
                    info.endpoints.add(endpoint);
                }
            });
        });

        return info;
    }

    private static String extractClassLevelPath(ClassOrInterfaceDeclaration clazz) {
        Optional<AnnotationExpr> requestMapping = clazz.getAnnotationByName("RequestMapping");
        if (requestMapping.isPresent()) {
            return extractPathFromAnnotation(requestMapping.get());
        }
        return "";
    }

    private static EndpointInfo extractEndpoint(MethodDeclaration method) {
        String[] mappingAnnotations = {"GetMapping", "PostMapping", "PutMapping", "DeleteMapping", "PatchMapping", "RequestMapping"};

        for (String annotation : mappingAnnotations) {
            Optional<AnnotationExpr> mapping = method.getAnnotationByName(annotation);
            if (mapping.isPresent()) {
                EndpointInfo endpoint = new EndpointInfo();
                endpoint.methodName = method.getNameAsString();
                endpoint.httpMethod = getHttpMethod(annotation, mapping.get());
                endpoint.path = extractPathFromAnnotation(mapping.get());
                endpoint.parameters = extractParameters(method);
                endpoint.returnType = method.getTypeAsString();
                return endpoint;
            }
        }
        return null;
    }

    private static String getHttpMethod(String annotation, AnnotationExpr expr) {
        switch (annotation) {
            case "GetMapping": return "GET";
            case "PostMapping": return "POST";
            case "PutMapping": return "PUT";
            case "DeleteMapping": return "DELETE";
            case "PatchMapping": return "PATCH";
            case "RequestMapping":
                // Try to find method attribute
                if (expr.isNormalAnnotationExpr()) {
                    for (MemberValuePair pair : expr.asNormalAnnotationExpr().getPairs()) {
                        if (pair.getNameAsString().equals("method")) {
                            return pair.getValue().toString().replace("RequestMethod.", "");
                        }
                    }
                }
                return "GET"; // default
            default: return "UNKNOWN";
        }
    }

    private static String extractPathFromAnnotation(AnnotationExpr annotation) {
        // Handle @GetMapping("/path")
        if (annotation.isSingleMemberAnnotationExpr()) {
            return cleanPath(annotation.asSingleMemberAnnotationExpr().getMemberValue().toString());
        }

        // Handle @GetMapping(value = "/path") or @RequestMapping(path = "/path")
        if (annotation.isNormalAnnotationExpr()) {
            for (MemberValuePair pair : annotation.asNormalAnnotationExpr().getPairs()) {
                if (pair.getNameAsString().equals("value") || pair.getNameAsString().equals("path")) {
                    return cleanPath(pair.getValue().toString());
                }
            }
        }

        return "";
    }

    private static String cleanPath(String path) {

        return path.replace("\"", "");
    }

    private static List<ParameterInfo> extractParameters(MethodDeclaration method) {
        List<ParameterInfo> params = new ArrayList<>();

        method.getParameters().forEach(param -> {
            ParameterInfo paramInfo = new ParameterInfo();
            paramInfo.name = param.getNameAsString();
            paramInfo.type = param.getTypeAsString();

            // Check for Spring annotations
            param.getAnnotations().forEach(ann -> {
                String annName = ann.getNameAsString();
                if (annName.equals("PathVariable") || annName.equals("RequestParam")
                        || annName.equals("RequestBody") || annName.equals("RequestHeader")) {
                    paramInfo.annotation = annName;
                }
            });

            params.add(paramInfo);
        });

        return params;
    }
}