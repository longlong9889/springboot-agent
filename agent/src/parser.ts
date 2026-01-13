import * as fs from "fs";
import * as path from "path";

interface ParameterInfo {
    name: string;
    type: string;
    annotation?: string;
}

interface EndpointInfo {
    httpMethod: string;
    path: string;
    methodName: string;
    returnType: string;
    parameters: ParameterInfo[];
}

interface ControllerInfo {
    className: string;
    basePath: string;
    endpoints: EndpointInfo[];
}

interface MethodInfo {
    name: string;
    returnType: string;
    parameters: ParameterInfo[];
}

interface DependencyInfo {
    type: string;
    name: string;
}

interface ServiceInfo {
    className: string;
    dependencies: DependencyInfo[];
    methods: MethodInfo[];
}

interface RepositoryInfo {
    interfaceName: string;
    entityType: string;
    idType: string;
    customMethods: MethodInfo[];
}

interface FieldInfo {
    name: string;
    type: string;
    annotations: string[];
}

interface RelationshipInfo {
    type: string;
    fieldName: string;
    targetEntity: string;
}

interface EntityInfo {
    className: string;
    tableName: string | null;
    fields: FieldInfo[];
    relationships: RelationshipInfo[];
}

interface ProjectOutput {
    controllers: ControllerInfo[];
    services: ServiceInfo[];
    repositories: RepositoryInfo[];
    entities: EntityInfo[];
}

// Find all Java files recursively
function findJavaFiles(dir: string): string[] {
    const files: string[] = [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.includes("test")) {
            files.push(...findJavaFiles(fullPath));
        } else if (entry.name.endsWith(".java") && !entry.name.includes("Test")) {
            files.push(fullPath);
        }
    }

    return files;
}

// Extract class name from content
function extractClassName(content: string): string | null {
    const match = content.match(/(?:public\s+)?(?:class|interface)\s+(\w+)/);
    return match ? match[1] : null;
}

// Extract annotations from a line or block
function getAnnotationValue(content: string, annotation: string): string {
    const patterns = [
        new RegExp(`@${annotation}\\("([^"]*)"\\)`),
        new RegExp(`@${annotation}\\(value\\s*=\\s*"([^"]*)"\\)`),
        new RegExp(`@${annotation}\\(path\\s*=\\s*"([^"]*)"\\)`),
    ];

    for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) return match[1];
    }
    return "";
}

// Parse controller
function parseController(content: string): ControllerInfo | null {
    if (!content.includes("@RestController") && !content.includes("@Controller")) {
        return null;
    }

    const className = extractClassName(content);
    if (!className) return null;

    const basePath = getAnnotationValue(content, "RequestMapping");
    const endpoints: EndpointInfo[] = [];

    const methodMappings = ["GetMapping", "PostMapping", "PutMapping", "DeleteMapping", "PatchMapping"];
    const httpMethods: { [key: string]: string } = {
        GetMapping: "GET",
        PostMapping: "POST",
        PutMapping: "PUT",
        DeleteMapping: "DELETE",
        PatchMapping: "PATCH",
    };

    // Match methods with mapping annotations
    const methodRegex = /@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)(\([^)]*\))?\s+public\s+(\S+)\s+(\w+)\s*\(([^)]*)\)/g;

    let match;
    while ((match = methodRegex.exec(content)) !== null) {
        const [, mappingType, mappingArgs, returnType, methodName, paramsStr] = match;

        let endpointPath = "";
        if (mappingArgs) {
            const pathMatch = mappingArgs.match(/"([^"]*)"/);
            if (pathMatch) endpointPath = pathMatch[1];
        }

        const parameters: ParameterInfo[] = [];
        if (paramsStr.trim()) {
            const params = paramsStr.split(",").map(p => p.trim()).filter(p => p);
            for (const param of params) {
                const annotationMatch = param.match(/@(\w+)/);
                const typeNameMatch = param.match(/(\w+(?:<[^>]+>)?)\s+(\w+)$/);

                if (typeNameMatch) {
                    parameters.push({
                        name: typeNameMatch[2],
                        type: typeNameMatch[1],
                        annotation: annotationMatch ? annotationMatch[1] : undefined,
                    });
                }
            }
        }

        endpoints.push({
            httpMethod: httpMethods[mappingType],
            path: endpointPath,
            methodName,
            returnType,
            parameters,
        });
    }

    return { className, basePath, endpoints };
}

// Parse service
function parseService(content: string): ServiceInfo | null {
    if (!content.includes("@Service")) return null;

    const className = extractClassName(content);
    if (!className) return null;

    const dependencies: DependencyInfo[] = [];
    const dependencyRegex = /@Autowired\s+(?:private\s+)?(\w+)\s+(\w+)/g;

    let match;
    while ((match = dependencyRegex.exec(content)) !== null) {
        dependencies.push({ type: match[1], name: match[2] });
    }

    const methods: MethodInfo[] = [];
    const methodRegex = /public\s+(\S+)\s+(\w+)\s*\(([^)]*)\)\s*\{/g;

    while ((match = methodRegex.exec(content)) !== null) {
        const [, returnType, methodName, paramsStr] = match;

        const parameters: ParameterInfo[] = [];
        if (paramsStr.trim()) {
            const params = paramsStr.split(",").map(p => p.trim()).filter(p => p);
            for (const param of params) {
                const typeNameMatch = param.match(/(\w+(?:<[^>]+>)?)\s+(\w+)$/);
                if (typeNameMatch) {
                    parameters.push({ name: typeNameMatch[2], type: typeNameMatch[1] });
                }
            }
        }

        methods.push({ name: methodName, returnType, parameters });
    }

    return { className, dependencies, methods };
}

// Parse repository
function parseRepository(content: string): RepositoryInfo | null {
    if (!content.includes("@Repository") && !content.includes("extends JpaRepository") && !content.includes("extends CrudRepository")) {
        return null;
    }

    const className = extractClassName(content);
    if (!className) return null;

    let entityType = "";
    let idType = "";

    const extendsMatch = content.match(/extends\s+(?:JpaRepository|CrudRepository)<(\w+),\s*(\w+)>/);
    if (extendsMatch) {
        entityType = extendsMatch[1];
        idType = extendsMatch[2];
    }

    const customMethods: MethodInfo[] = [];
    const methodRegex = /(?:List<\w+>|\w+)\s+(\w+)\s*\(([^)]*)\)/g;

    let match;
    while ((match = methodRegex.exec(content)) !== null) {
        const fullMatch = match[0];
        const methodName = match[1];
        const paramsStr = match[2];

        // Skip if it's the interface declaration
        if (methodName === className) continue;

        const returnTypeMatch = fullMatch.match(/^(\S+)\s+/);
        const returnType = returnTypeMatch ? returnTypeMatch[1] : "void";

        const parameters: ParameterInfo[] = [];
        if (paramsStr.trim()) {
            const params = paramsStr.split(",").map(p => p.trim()).filter(p => p);
            for (const param of params) {
                const typeNameMatch = param.match(/(\w+(?:<[^>]+>)?)\s+(\w+)$/);
                if (typeNameMatch) {
                    parameters.push({ name: typeNameMatch[2], type: typeNameMatch[1] });
                }
            }
        }

        customMethods.push({ name: methodName, returnType, parameters });
    }

    return { interfaceName: className, entityType, idType, customMethods };
}

// Parse entity
function parseEntity(content: string): EntityInfo | null {
    if (!content.includes("@Entity")) return null;

    const className = extractClassName(content);
    if (!className) return null;

    const tableName = getAnnotationValue(content, "Table") || null;

    const fields: FieldInfo[] = [];
    const relationships: RelationshipInfo[] = [];

    const fieldRegex = /((?:@\w+(?:\([^)]*\))?[\s\n]+)*)private\s+(\w+(?:<[^>]+>)?)\s+(\w+)\s*;/g;

    let match;
    while ((match = fieldRegex.exec(content)) !== null) {
        const [, annotations, type, name] = match;

        const relationshipTypes = ["OneToMany", "ManyToOne", "OneToOne", "ManyToMany"];
        let isRelationship = false;

        for (const relType of relationshipTypes) {
            if (annotations.includes(`@${relType}`)) {
                isRelationship = true;

                let targetEntity = type;
                if (type.includes("<")) {
                    const genericMatch = type.match(/<(\w+)>/);
                    if (genericMatch) targetEntity = genericMatch[1];
                }

                relationships.push({
                    type: relType,
                    fieldName: name,
                    targetEntity,
                });
                break;
            }
        }

        if (!isRelationship) {
            const fieldAnnotations: string[] = [];
            if (annotations.includes("@Id")) fieldAnnotations.push("@Id");
            if (annotations.includes("@GeneratedValue")) fieldAnnotations.push("@GeneratedValue");
            if (annotations.includes("@Column")) fieldAnnotations.push("@Column");

            fields.push({ name, type, annotations: fieldAnnotations });
        }
    }

    return { className, tableName, fields, relationships };
}

// Main parse function
export function parseProject(projectPath: string): ProjectOutput {
    const output: ProjectOutput = {
        controllers: [],
        services: [],
        repositories: [],
        entities: [],
    };

    const javaFiles = findJavaFiles(projectPath);

    for (const file of javaFiles) {
        const content = fs.readFileSync(file, "utf-8");

        const controller = parseController(content);
        if (controller && controller.endpoints.length > 0) {
            output.controllers.push(controller);
            continue;
        }

        const service = parseService(content);
        if (service) {
            output.services.push(service);
            continue;
        }

        const repository = parseRepository(content);
        if (repository) {
            output.repositories.push(repository);
            continue;
        }

        const entity = parseEntity(content);
        if (entity) {
            output.entities.push(entity);
        }
    }

    return output;
}