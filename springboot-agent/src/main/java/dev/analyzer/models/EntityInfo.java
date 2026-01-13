package dev.analyzer.models;

import java.util.ArrayList;
import java.util.List;

public class EntityInfo {
    public String className;
    public String tableName;
    public List<FieldInfo> fields = new ArrayList<>();
    public List<RelationshipInfo> relationships = new ArrayList<>();

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Entity: ").append(className).append("\n");
        sb.append("Table: ").append(tableName != null ? tableName : className).append("\n");
        sb.append("Fields:\n");
        for (FieldInfo f : fields) {
            sb.append("  ").append(f).append("\n");
        }
        sb.append("Relationships:\n");
        for (RelationshipInfo r : relationships) {
            sb.append("  ").append(r).append("\n");
        }
        return sb.toString();
    }
}