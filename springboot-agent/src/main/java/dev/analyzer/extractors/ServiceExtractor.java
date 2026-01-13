package dev.analyzer.extractors;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;

import dev.analyzer.models.DependencyInfo;
import dev.analyzer.models.MethodInfo;
import dev.analyzer.models.ParameterInfo;
import dev.analyzer.models.ServiceInfo;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class ServiceExtractor {

    public static ServiceInfo extract(File file) throws Exception {
        CompilationUnit cu = StaticJavaParser.parse(file);

        ServiceInfo info = new ServiceInfo();

        cu.findAll(ClassOrInterfaceDeclaration.class).forEach(clazz -> {
            boolean isService = clazz.getAnnotations().stream()
                    .anyMatch(a -> a.getNameAsString().equals("Service"));

            if (!isService) return;

            info.className = clazz.getNameAsString();

            // Extract dependencies
            clazz.getFields().forEach(field -> {
                DependencyInfo dep = extractDependency(field);
                if (dep != null) {
                    info.dependencies.add(dep);
                }
            });

            // Extract methods
            clazz.getMethods().forEach(method -> {
                if (method.isPublic()) {
                    MethodInfo methodInfo = extractMethod(method);
                    info.methods.add(methodInfo);
                }
            });
        });

        return info;
    }

    private static DependencyInfo extractDependency(FieldDeclaration field) {
        boolean isInjected = field.getAnnotations().stream()
                .anyMatch(a -> a.getNameAsString().equals("Autowired"));

        if (!isInjected) return null;

        DependencyInfo dep = new DependencyInfo();
        dep.type = field.getElementType().asString();
        dep.name = field.getVariables().get(0).getNameAsString();
        return dep;
    }

    private static MethodInfo extractMethod(MethodDeclaration method) {
        MethodInfo info = new MethodInfo();
        info.name = method.getNameAsString();
        info.returnType = method.getTypeAsString();
        info.parameters = extractParameters(method);
        return info;
    }

    private static List<ParameterInfo> extractParameters(MethodDeclaration method) {
        List<ParameterInfo> params = new ArrayList<>();

        method.getParameters().forEach(param -> {
            ParameterInfo paramInfo = new ParameterInfo();
            paramInfo.name = param.getNameAsString();
            paramInfo.type = param.getTypeAsString();
            params.add(paramInfo);
        });

        return params;
    }
}