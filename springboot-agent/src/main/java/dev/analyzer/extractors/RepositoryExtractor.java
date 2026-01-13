package dev.analyzer.extractors;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.type.ClassOrInterfaceType;

import dev.analyzer.models.MethodInfo;
import dev.analyzer.models.ParameterInfo;
import dev.analyzer.models.RepositoryInfo;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class RepositoryExtractor {

    public static RepositoryInfo extract(File file) throws Exception {
        CompilationUnit cu = StaticJavaParser.parse(file);

        RepositoryInfo info = new RepositoryInfo();

        cu.findAll(ClassOrInterfaceDeclaration.class).forEach(clazz -> {
            if (!clazz.isInterface()) return;

            boolean isRepository = clazz.getAnnotations().stream()
                    .anyMatch(a -> a.getNameAsString().equals("Repository"))
                    || extendsSpringRepository(clazz);

            if (!isRepository) return;

            info.interfaceName = clazz.getNameAsString();

            // Extract entity and ID type from extends clause
            extractGenericTypes(clazz, info);

            // Extract custom query methods
            clazz.getMethods().forEach(method -> {
                MethodInfo methodInfo = extractMethod(method);
                info.customMethods.add(methodInfo);
            });
        });

        return info;
    }

    private static boolean extendsSpringRepository(ClassOrInterfaceDeclaration clazz) {
        return clazz.getExtendedTypes().stream()
                .anyMatch(t -> {
                    String name = t.getNameAsString();
                    return name.equals("JpaRepository")
                            || name.equals("CrudRepository")
                            || name.equals("PagingAndSortingRepository")
                            || name.equals("MongoRepository");
                });
    }

    private static void extractGenericTypes(ClassOrInterfaceDeclaration clazz, RepositoryInfo info) {
        clazz.getExtendedTypes().forEach(extendedType -> {
            if (extendedType.getTypeArguments().isPresent()) {
                var typeArgs = extendedType.getTypeArguments().get();
                if (typeArgs.size() >= 2) {
                    info.entityType = typeArgs.get(0).asString();
                    info.idType = typeArgs.get(1).asString();
                }
            }
        });
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