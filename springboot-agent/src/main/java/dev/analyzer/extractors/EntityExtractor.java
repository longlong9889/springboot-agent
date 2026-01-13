package dev.analyzer.extractors;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.expr.AnnotationExpr;
import com.github.javaparser.ast.expr.MemberValuePair;

import dev.analyzer.models.EntityInfo;
import dev.analyzer.models.FieldInfo;
import dev.analyzer.models.RelationshipInfo;

import java.io.File;
import java.util.Arrays;
import java.util.List;

public class EntityExtractor {

    private static final List<String> RELATIONSHIP_ANNOTATIONS = Arrays.asList(
            "OneToMany", "ManyToOne", "OneToOne", "ManyToMany"
    );

    public static EntityInfo extract(File file) throws Exception {
        CompilationUnit cu = StaticJavaParser.parse(file);

        EntityInfo info = new EntityInfo();

        cu.findAll(ClassOrInterfaceDeclaration.class).forEach(clazz -> {
            boolean isEntity = clazz.getAnnotations().stream()
                    .anyMatch(a -> a.getNameAsString().equals("Entity"));

            if (!isEntity) return;

            info.className = clazz.getNameAsString();
            info.tableName = extractTableName(clazz);

            clazz.getFields().forEach(field -> {
                if (isRelationship(field)) {
                    RelationshipInfo rel = extractRelationship(field);
                    if (rel != null) {
                        info.relationships.add(rel);
                    }
                } else {
                    FieldInfo fieldInfo = extractField(field);
                    info.fields.add(fieldInfo);
                }
            });
        });

        return info;
    }

    private static String extractTableName(ClassOrInterfaceDeclaration clazz) {
        var tableAnn = clazz.getAnnotationByName("Table");
        if (tableAnn.isPresent() && tableAnn.get().isNormalAnnotationExpr()) {
            for (MemberValuePair pair : tableAnn.get().asNormalAnnotationExpr().getPairs()) {
                if (pair.getNameAsString().equals("name")) {
                    return pair.getValue().toString().replace("\"", "");
                }
            }
        }
        return null;
    }

    private static boolean isRelationship(FieldDeclaration field) {
        return field.getAnnotations().stream()
                .anyMatch(a -> RELATIONSHIP_ANNOTATIONS.contains(a.getNameAsString()));
    }

    private static FieldInfo extractField(FieldDeclaration field) {
        FieldInfo info = new FieldInfo();
        info.name = field.getVariables().get(0).getNameAsString();
        info.type = field.getElementType().asString();

        field.getAnnotations().forEach(ann -> {
            String name = ann.getNameAsString();
            if (name.equals("Id") || name.equals("Column") || name.equals("GeneratedValue")) {
                info.annotations.add("@" + name);
            }
        });

        return info;
    }

    private static RelationshipInfo extractRelationship(FieldDeclaration field) {
        RelationshipInfo info = new RelationshipInfo();
        info.fieldName = field.getVariables().get(0).getNameAsString();

        // Get the target entity type
        String fieldType = field.getElementType().asString();
        if (fieldType.contains("List") || fieldType.contains("Set")) {
            // Extract generic type: List<Order> -> Order
            var variable = field.getVariables().get(0);
            String fullType = variable.getTypeAsString();
            int start = fullType.indexOf("<");
            int end = fullType.indexOf(">");
            if (start != -1 && end != -1) {
                info.targetEntity = fullType.substring(start + 1, end);
            }
        } else {
            info.targetEntity = fieldType;
        }

        // Get relationship type
        for (AnnotationExpr ann : field.getAnnotations()) {
            if (RELATIONSHIP_ANNOTATIONS.contains(ann.getNameAsString())) {
                info.type = ann.getNameAsString();
                break;
            }
        }

        return info;
    }
}