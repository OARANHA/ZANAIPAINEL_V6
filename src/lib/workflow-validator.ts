export interface ValidationError {
  type: 'error' | 'warning' | 'info';
  message: string;
  nodeId?: string;
  edgeId?: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
  score: number; // 0-100 validation score
}

export class WorkflowValidator {
  // Validate a complete workflow
  static validateWorkflow(nodes: any[], edges: any[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // Basic structural validation
    this.validateStructure(nodes, edges, errors, warnings, info);
    
    // Node-specific validation
    this.validateNodes(nodes, errors, warnings, info);
    
    // Connection validation
    this.validateConnections(nodes, edges, errors, warnings, info);
    
    // Workflow logic validation
    this.validateWorkflowLogic(nodes, edges, errors, warnings, info);

    // Calculate validation score
    const score = this.calculateValidationScore(errors, warnings, info);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
      score
    };
  }

  // Validate basic workflow structure
  private static validateStructure(
    nodes: any[], 
    edges: any[], 
    errors: ValidationError[], 
    warnings: ValidationError[], 
    info: ValidationError[]
  ) {
    // Check for empty workflow
    if (nodes.length === 0) {
      errors.push({
        type: 'error',
        message: 'Workflow não contém nós',
        severity: 'high'
      });
      return;
    }

    // Check for disconnected nodes
    const connectedNodes = new Set();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && node.data?.type !== 'Start') {
        warnings.push({
          type: 'warning',
          message: `Nó "${node.data?.label || node.id}" está desconectado`,
          nodeId: node.id,
          severity: 'medium'
        });
      }
    });

    // Check for missing start node
    const hasStartNode = nodes.some(n => n.data?.type === 'Start');
    if (!hasStartNode) {
      errors.push({
        type: 'error',
        message: 'Workflow não tem nó de início (Start)',
        severity: 'high'
      });
    }

    // Check for isolated nodes (no connections)
    const isolatedNodes = nodes.filter(node => 
      !edges.some(edge => edge.source === node.id || edge.target === node.id)
    );
    
    if (isolatedNodes.length > 1) {
      warnings.push({
        type: 'warning',
        message: `${isolatedNodes.length} nós estão isolados`,
        severity: 'medium'
      });
    }
  }

  // Validate individual nodes
  private static validateNodes(
    nodes: any[], 
    errors: ValidationError[], 
    warnings: ValidationError[], 
    info: ValidationError[]
  ) {
    nodes.forEach(node => {
      // Validate required node properties
      if (!node.data?.label || node.data.label.trim() === '') {
        errors.push({
          type: 'error',
          message: `Nó ${node.id} não tem rótulo`,
          nodeId: node.id,
          severity: 'high'
        });
      }

      // Validate node-specific requirements
      switch (node.data?.type) {
        case 'LLM':
          this.validateLLMNode(node, errors, warnings);
          break;
        case 'Agent':
          this.validateAgentNode(node, errors, warnings);
          break;
        case 'API':
          this.validateAPINode(node, errors, warnings);
          break;
        case 'Condition':
          this.validateConditionNode(node, errors, warnings);
          break;
        case 'Document':
          this.validateDocumentNode(node, errors, warnings);
          break;
      }
    });
  }

  // Validate LLM nodes
  private static validateLLMNode(node: any, errors: ValidationError[], warnings: ValidationError[]) {
    if (!node.data?.model) {
      warnings.push({
        type: 'warning',
        message: `Nó LLM "${node.data?.label}" não tem modelo especificado`,
        nodeId: node.id,
        severity: 'medium'
      });
    }

    if (!node.data?.prompt || node.data.prompt.trim() === '') {
      errors.push({
        type: 'error',
        message: `Nó LLM "${node.data?.label}" não tem prompt`,
        nodeId: node.id,
        severity: 'high'
      });
    }

    if (node.data?.prompt && node.data.prompt.length > 2000) {
      warnings.push({
        type: 'warning',
        message: `Prompt do nó "${node.data?.label}" é muito longo (>2000 caracteres)`,
        nodeId: node.id,
        severity: 'low'
      });
    }
  }

  // Validate Agent nodes
  private static validateAgentNode(node: any, errors: ValidationError[], warnings: ValidationError[]) {
    if (!node.data?.agentType) {
      warnings.push({
        type: 'warning',
        message: `Nó Agent "${node.data?.label}" não tem tipo de agente especificado`,
        nodeId: node.id,
        severity: 'medium'
      });
    }

    if (!node.data?.instructions || node.data.instructions.trim() === '') {
      errors.push({
        type: 'error',
        message: `Nó Agent "${node.data?.label}" não tem instruções`,
        nodeId: node.id,
        severity: 'high'
      });
    }
  }

  // Validate API nodes
  private static validateAPINode(node: any, errors: ValidationError[], warnings: ValidationError[]) {
    if (!node.data?.url) {
      errors.push({
        type: 'error',
        message: `Nó API "${node.data?.label}" não tem URL`,
        nodeId: node.id,
        severity: 'high'
      });
    }

    if (node.data?.url && !this.isValidURL(node.data.url)) {
      errors.push({
        type: 'error',
        message: `URL do nó "${node.data?.label}" é inválida`,
        nodeId: node.id,
        severity: 'high'
      });
    }

    if (!node.data?.method) {
      warnings.push({
        type: 'warning',
        message: `Nó API "${node.data?.label}" não tem método HTTP especificado`,
        nodeId: node.id,
        severity: 'medium'
      });
    }
  }

  // Validate Condition nodes
  private static validateConditionNode(node: any, errors: ValidationError[], warnings: ValidationError[]) {
    if (!node.data?.condition) {
      errors.push({
        type: 'error',
        message: `Nó Condition "${node.data?.label}" não tem condição definida`,
        nodeId: node.id,
        severity: 'high'
      });
    }

    if (node.data?.condition && !this.isValidCondition(node.data.condition)) {
      errors.push({
        type: 'error',
        message: `Condição do nó "${node.data?.label}" é inválida`,
        nodeId: node.id,
        severity: 'high'
      });
    }
  }

  // Validate Document nodes
  private static validateDocumentNode(node: any, errors: ValidationError[], warnings: ValidationError[]) {
    if (!node.data?.documentType) {
      warnings.push({
        type: 'warning',
        message: `Nó Document "${node.data?.label}" não tem tipo de documento especificado`,
        nodeId: node.id,
        severity: 'medium'
      });
    }

    if (!node.data?.content || node.data.content.trim() === '') {
      warnings.push({
        type: 'warning',
        message: `Nó Document "${node.data?.label}" não tem conteúdo`,
        nodeId: node.id,
        severity: 'medium'
      });
    }
  }

  // Validate connections between nodes
  private static validateConnections(
    nodes: any[], 
    edges: any[], 
    errors: ValidationError[], 
    warnings: ValidationError[], 
    info: ValidationError[]
  ) {
    // Check for duplicate connections
    const connectionMap = new Set();
    edges.forEach((edge, index) => {
      const connectionKey = `${edge.source}-${edge.target}`;
      if (connectionMap.has(connectionKey)) {
        errors.push({
          type: 'error',
          message: `Conexão duplicada entre ${edge.source} e ${edge.target}`,
          edgeId: `edge_${index}`,
          severity: 'high'
        });
      }
      connectionMap.add(connectionKey);
    });

    // Check for self-connections
    edges.forEach((edge, index) => {
      if (edge.source === edge.target) {
        errors.push({
          type: 'error',
          message: `Nó ${edge.source} está conectado a si mesmo`,
          edgeId: `edge_${index}`,
          severity: 'high'
        });
      }
    });

    // Check for circular dependencies
    if (this.hasCircularDependencies(nodes, edges)) {
      errors.push({
        type: 'error',
        message: 'Workflow contém dependências circulares',
        severity: 'high'
      });
    }

    // Check for connection limits
    const connectionCounts = new Map<string, number>();
    edges.forEach(edge => {
      connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
      connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
    });

    connectionCounts.forEach((count, nodeId) => {
      if (count > 5) {
        warnings.push({
          type: 'warning',
          message: `Nó ${nodeId} tem muitas conexões (${count})`,
          nodeId: nodeId,
          severity: 'medium'
        });
      }
    });
  }

  // Validate workflow logic
  private static validateWorkflowLogic(
    nodes: any[], 
    edges: any[], 
    errors: ValidationError[], 
    warnings: ValidationError[], 
    info: ValidationError[]
  ) {
    // Check for unreachable nodes
    const startNodes = nodes.filter(n => n.data?.type === 'Start');
    if (startNodes.length > 0) {
      const reachableNodes = this.getReachableNodes(startNodes[0].id, edges);
      const unreachableNodes = nodes.filter(n => 
        n.id !== startNodes[0].id && !reachableNodes.has(n.id)
      );

      if (unreachableNodes.length > 0) {
        warnings.push({
          type: 'warning',
          message: `${unreachableNodes.length} nós não são alcançáveis a partir do nó inicial`,
          severity: 'medium'
        });
      }
    }

    // Check for dead ends
    const endNodes = nodes.filter(node => 
      !edges.some(edge => edge.source === node.id)
    );

    if (endNodes.length > 1) {
      info.push({
        type: 'info',
        message: `Workflow tem ${endNodes.length} pontos finais`,
        severity: 'low'
      });
    }

    // Check for potential performance issues
    const llmNodes = nodes.filter(n => n.data?.type === 'LLM');
    if (llmNodes.length > 3) {
      warnings.push({
        type: 'warning',
        message: `Workflow contém muitos nós LLM (${llmNodes.length}) - pode impactar performance`,
        severity: 'medium'
      });
    }

    // Check for missing error handling
    const hasErrorHandling = nodes.some(n => 
      n.data?.type === 'Condition' && 
      n.data?.label?.toLowerCase().includes('error')
    );

    if (!hasErrorHandling && nodes.length > 3) {
      warnings.push({
        type: 'warning',
        message: 'Workflow não tem tratamento de erros',
        severity: 'medium'
      });
    }
  }

  // Helper methods
  private static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private static isValidCondition(condition: string): boolean {
    // Basic condition validation - can be enhanced
    return condition.trim().length > 0;
  }

  private static hasCircularDependencies(nodes: any[], edges: any[]): boolean {
    // Simple circular dependency detection
    const graph = new Map<string, string[]>();
    
    // Build adjacency list
    nodes.forEach(node => {
      graph.set(node.id, []);
    });

    edges.forEach(edge => {
      const neighbors = graph.get(edge.source) || [];
      neighbors.push(edge.target);
      graph.set(edge.source, neighbors);
    });

    // Check for cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of graph.keys()) {
      if (hasCycle(nodeId)) {
        return true;
      }
    }

    return false;
  }

  private static getReachableNodes(startId: string, edges: any[]): Set<string> {
    const reachable = new Set<string>();
    const queue = [startId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;

      visited.add(currentId);
      reachable.add(currentId);

      // Find all nodes connected from current node
      const connections = edges.filter(edge => edge.source === currentId);
      connections.forEach(edge => {
        if (!visited.has(edge.target)) {
          queue.push(edge.target);
        }
      });
    }

    return reachable;
  }

  private static calculateValidationScore(
    errors: ValidationError[], 
    warnings: ValidationError[], 
    info: ValidationError[]
  ): number {
    let score = 100;

    // Deduct points for errors
    errors.forEach(error => {
      switch (error.severity) {
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Deduct points for warnings
    warnings.forEach(warning => {
      switch (warning.severity) {
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });

    // Info messages don't deduct points but limit max score
    if (info.length > 5) {
      score -= Math.min(5, info.length - 5);
    }

    return Math.max(0, Math.min(100, score));
  }
}