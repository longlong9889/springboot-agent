package dev.analyzer.models;

public class RelationshipInfo {
    public String type;        // OneToMany, ManyToOne, etc.
    public String fieldName;
    public String targetEntity;

    @Override
    public String toString() {
        return "@" + type + " " + targetEntity + " " + fieldName;
    }
}