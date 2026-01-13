package dev.analyzer.scanner;

import dev.analyzer.models.ControllerInfo;
import dev.analyzer.models.EntityInfo;
import dev.analyzer.models.RepositoryInfo;
import dev.analyzer.models.ServiceInfo;

import java.util.List;

public class ProjectOutput {
    public List<ControllerInfo> controllers;
    public List<ServiceInfo> services;
    public List<RepositoryInfo> repositories;
    public List<EntityInfo> entities;

    public ProjectOutput(
            List<ControllerInfo> controllers,
            List<ServiceInfo> services,
            List<RepositoryInfo> repositories,
            List<EntityInfo> entities
    ) {
        this.controllers = controllers;
        this.services = services;
        this.repositories = repositories;
        this.entities = entities;
    }
}
