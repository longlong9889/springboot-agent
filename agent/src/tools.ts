import * as fs from "fs";
import * as path from "path";

// Default data path
let currentDataPath = path.join(__dirname, "data", "project-analysis.json");
let projectData: any = null;

// Function to load/reload project data
export function loadProjectData(dataPath?: string): void {
    if (dataPath) {
        currentDataPath = dataPath;
    }
    projectData = JSON.parse(fs.readFileSync(currentDataPath, "utf-8"));
}

// Initialize with default data
loadProjectData();

// Tool: List all endpoints
export function listEndpoints(): string {
    const endpoints: string[] = [];

    for (const controller of projectData.controllers) {
        const basePath = controller.basePath || "";
        for (const endpoint of controller.endpoints) {
            const fullPath = `${basePath}${endpoint.path}`;
            endpoints.push(
                `${endpoint.httpMethod} ${fullPath} → ${controller.className}.${endpoint.methodName}()`
            );
        }
    }

    return endpoints.join("\n");
}

// Tool: Get controller info
export function getControllerInfo(controllerName: string): string {
    const controller = projectData.controllers.find(
        (c: any) =>
            c.className.toLowerCase() === controllerName.toLowerCase() ||
            c.className.toLowerCase().includes(controllerName.toLowerCase())
    );

    if (!controller) {
        return `Controller "${controllerName}" not found.`;
    }

    let result = `Controller: ${controller.className}\n`;
    result += `Base Path: ${controller.basePath || "/"}\n`;
    result += `Endpoints:\n`;

    for (const endpoint of controller.endpoints) {
        const params = endpoint.parameters
            .map((p: any) => `${p.annotation ? "@" + p.annotation + " " : ""}${p.type} ${p.name}`)
            .join(", ");
        result += `  ${endpoint.httpMethod} ${endpoint.path} → ${endpoint.methodName}(${params}): ${endpoint.returnType}\n`;
    }

    return result;
}

// Tool: Get service info
export function getServiceInfo(serviceName: string): string {
    const service = projectData.services.find(
        (s: any) =>
            s.className.toLowerCase() === serviceName.toLowerCase() ||
            s.className.toLowerCase().includes(serviceName.toLowerCase())
    );

    if (!service) {
        return `Service "${serviceName}" not found.`;
    }

    let result = `Service: ${service.className}\n`;

    if (service.dependencies.length > 0) {
        result += `Dependencies:\n`;
        for (const dep of service.dependencies) {
            result += `  ${dep.type} ${dep.name}\n`;
        }
    }

    result += `Methods:\n`;
    for (const method of service.methods) {
        const params = method.parameters
            .map((p: any) => `${p.type} ${p.name}`)
            .join(", ");
        result += `  ${method.name}(${params}): ${method.returnType}\n`;
    }

    return result;
}

// Tool: Get repository info
export function getRepositoryInfo(repoName: string): string {
    const repo = projectData.repositories.find(
        (r: any) =>
            r.interfaceName.toLowerCase() === repoName.toLowerCase() ||
            r.interfaceName.toLowerCase().includes(repoName.toLowerCase())
    );

    if (!repo) {
        return `Repository "${repoName}" not found.`;
    }

    let result = `Repository: ${repo.interfaceName}\n`;
    result += `Entity: ${repo.entityType}\n`;
    result += `ID Type: ${repo.idType}\n`;
    result += `Custom Methods:\n`;

    for (const method of repo.customMethods) {
        const params = method.parameters
            .map((p: any) => `${p.type} ${p.name}`)
            .join(", ");
        result += `  ${method.name}(${params}): ${method.returnType}\n`;
    }

    return result;
}

// Tool: Get entity info
export function getEntityInfo(entityName: string): string {
    const entity = projectData.entities.find(
        (e: any) =>
            e.className.toLowerCase() === entityName.toLowerCase() ||
            e.className.toLowerCase().includes(entityName.toLowerCase())
    );

    if (!entity) {
        return `Entity "${entityName}" not found.`;
    }

    let result = `Entity: ${entity.className}\n`;
    result += `Table: ${entity.tableName || entity.className}\n`;
    result += `Fields:\n`;

    for (const field of entity.fields) {
        const annotations = field.annotations.length > 0 ? `${field.annotations.join(", ")} ` : "";
        result += `  ${annotations}${field.type} ${field.name}\n`;
    }

    if (entity.relationships.length > 0) {
        result += `Relationships:\n`;
        for (const rel of entity.relationships) {
            result += `  @${rel.type} ${rel.targetEntity} ${rel.fieldName}\n`;
        }
    }

    return result;
}

// Tool: Trace endpoint flow
export function traceEndpoint(method: string, urlPath: string): string {
    let foundController: any = null;
    let foundEndpoint: any = null;

    for (const controller of projectData.controllers) {
        for (const endpoint of controller.endpoints) {
            const fullPath = `${controller.basePath}${endpoint.path}`;
            if (
                endpoint.httpMethod.toLowerCase() === method.toLowerCase() &&
                (fullPath.includes(urlPath) || urlPath.includes(endpoint.path))
            ) {
                foundController = controller;
                foundEndpoint = endpoint;
                break;
            }
        }
    }

    if (!foundEndpoint) {
        return `Endpoint "${method} ${urlPath}" not found.`;
    }

    let result = `=== Tracing ${method.toUpperCase()} ${urlPath} ===\n\n`;

    result += `1. CONTROLLER: ${foundController.className}\n`;
    result += `   Method: ${foundEndpoint.methodName}()\n`;
    result += `   Returns: ${foundEndpoint.returnType}\n\n`;

    const controllerPrefix = foundController.className.replace("Controller", "");
    const service = projectData.services.find((s: any) =>
        s.className.includes(controllerPrefix)
    );

    if (service) {
        result += `2. SERVICE: ${service.className}\n`;
        result += `   Dependencies: ${service.dependencies.map((d: any) => d.type).join(", ") || "none"}\n`;
        result += `   Methods: ${service.methods.map((m: any) => m.name).join(", ")}\n\n`;

        const repo = projectData.repositories.find((r: any) =>
            r.interfaceName.includes(controllerPrefix)
        );

        if (repo) {
            result += `3. REPOSITORY: ${repo.interfaceName}\n`;
            result += `   Entity: ${repo.entityType}\n`;
            result += `   Custom queries: ${repo.customMethods.map((m: any) => m.name).join(", ")}\n\n`;

            const entity = projectData.entities.find(
                (e: any) => e.className === repo.entityType
            );

            if (entity) {
                result += `4. ENTITY: ${entity.className}\n`;
                result += `   Table: ${entity.tableName}\n`;
                result += `   Fields: ${entity.fields.map((f: any) => f.name).join(", ")}\n`;
            }
        }
    }

    return result;
}

// Tool: Get project summary
export function getProjectSummary(): string {
    let result = `=== PROJECT SUMMARY ===\n\n`;
    result += `Controllers: ${projectData.controllers.length}\n`;
    result += `Services: ${projectData.services.length}\n`;
    result += `Repositories: ${projectData.repositories.length}\n`;
    result += `Entities: ${projectData.entities.length}\n\n`;

    result += `Controllers: ${projectData.controllers.map((c: any) => c.className).join(", ")}\n`;
    result += `Entities: ${projectData.entities.map((e: any) => e.className).join(", ")}\n`;

    const totalEndpoints = projectData.controllers.reduce(
        (sum: number, c: any) => sum + c.endpoints.length,
        0
    );
    result += `Total Endpoints: ${totalEndpoints}\n`;

    return result;
}

// Export all tools for the agent
export const tools = [
    {
        type: "function" as const,
        function: {
            name: "list_endpoints",
            description: "List all API endpoints in the Spring Boot project",
            parameters: { type: "object", properties: {}, required: [] },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_controller_info",
            description: "Get detailed information about a specific controller",
            parameters: {
                type: "object",
                properties: {
                    controller_name: {
                        type: "string",
                        description: "The name of the controller (e.g., 'UserController' or 'User')",
                    },
                },
                required: ["controller_name"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_service_info",
            description: "Get detailed information about a specific service",
            parameters: {
                type: "object",
                properties: {
                    service_name: {
                        type: "string",
                        description: "The name of the service (e.g., 'UserService' or 'User')",
                    },
                },
                required: ["service_name"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_repository_info",
            description: "Get detailed information about a specific repository",
            parameters: {
                type: "object",
                properties: {
                    repo_name: {
                        type: "string",
                        description: "The name of the repository (e.g., 'UserRepository' or 'User')",
                    },
                },
                required: ["repo_name"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_entity_info",
            description: "Get detailed information about a specific entity/model",
            parameters: {
                type: "object",
                properties: {
                    entity_name: {
                        type: "string",
                        description: "The name of the entity (e.g., 'User')",
                    },
                },
                required: ["entity_name"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "trace_endpoint",
            description: "Trace the flow of a specific endpoint from controller to database",
            parameters: {
                type: "object",
                properties: {
                    method: {
                        type: "string",
                        description: "HTTP method (GET, POST, PUT, DELETE, PATCH)",
                    },
                    path: {
                        type: "string",
                        description: "The endpoint path (e.g., '/users' or 'users/{id}')",
                    },
                },
                required: ["method", "path"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_project_summary",
            description: "Get a high-level summary of the entire Spring Boot project",
            parameters: { type: "object", properties: {}, required: [] },
        },
    },
];

// Function to execute a tool
export function executeTool(name: string, args: any): string {
    switch (name) {
        case "list_endpoints":
            return listEndpoints();
        case "get_controller_info":
            return getControllerInfo(args.controller_name);
        case "get_service_info":
            return getServiceInfo(args.service_name);
        case "get_repository_info":
            return getRepositoryInfo(args.repo_name);
        case "get_entity_info":
            return getEntityInfo(args.entity_name);
        case "trace_endpoint":
            return traceEndpoint(args.method, args.path);
        case "get_project_summary":
            return getProjectSummary();
        default:
            return `Unknown tool: ${name}`;
    }
}