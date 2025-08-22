"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Save, 
  Upload, 
  Download, 
  Settings, 
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Zap,
  Target,
  FileText,
  Code,
  Users,
  Database
} from 'lucide-react';
import DrawflowCanvas from './DrawflowCanvas';
import NodeEditorDialog from './NodeEditorDialog';
import WorkflowComplexityBadge from './WorkflowComplexityBadge';

interface FlowiseWorkflow {
  id: string;
  flowiseId: string;
  name: string;
  description?: string;
  type: 'CHATFLOW' | 'AGENTFLOW' | 'MULTIAGENT' | 'ASSISTANT';
  deployed: boolean;
  isPublic: boolean;
  category?: string;
  complexityScore: number;
  nodeCount: number;
  edgeCount: number;
  maxDepth: number;
  capabilities: WorkflowCapabilities;
  nodes?: string; // JSON string
  connections?: string; // JSON string
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  flowData: string; // JSON com estrutura completa
}

interface WorkflowCapabilities {
  canHandleFileUpload: boolean;
  hasStreaming: boolean;
  supportsMultiLanguage: boolean;
  hasMemory: boolean;
  usesExternalAPIs: boolean;
  hasAnalytics: boolean;
  supportsParallelProcessing: boolean;
  hasErrorHandling: boolean;
}

interface HybridWorkflowEditorProps {
  workflow: FlowiseWorkflow;
  onSave?: (updatedWorkflow: FlowiseWorkflow) => void;
  onPreview?: () => void;
  onExport?: () => void;
  onPublishToAgents?: () => void;
  className?: string;
}

export default function HybridWorkflowEditor({
  workflow,
  onSave,
  onPreview,
  onExport,
  onPublishToAgents,
  className = ""
}: HybridWorkflowEditorProps) {
  const [activeTab, setActiveTab] = useState('canvas');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isNodeEditorOpen, setIsNodeEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [workflowData, setWorkflowData] = useState(workflow);

  // Update workflow data when prop changes
  useEffect(() => {
    setWorkflowData(workflow);
  }, [workflow]);

  // Handle node click
  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
  };

  // Handle node edit
  const handleNodeEdit = (node: any) => {
    setSelectedNode(node);
    setIsNodeEditorOpen(true);
  };

  // Handle node save
  const handleNodeSave = (nodeId: string, updates: any) => {
    // Update the workflow data with node changes
    try {
      const flowData = JSON.parse(workflowData.flowData);
      const nodeIndex = flowData.nodes.findIndex((n: any) => n.id === nodeId);
      
      if (nodeIndex !== -1) {
        flowData.nodes[nodeIndex] = {
          ...flowData.nodes[nodeIndex],
          data: {
            ...flowData.nodes[nodeIndex].data,
            ...updates
          }
        };
        
        const updatedWorkflow = {
          ...workflowData,
          flowData: JSON.stringify(flowData),
          updatedAt: new Date().toISOString()
        };
        
        setWorkflowData(updatedWorkflow);
      }
    } catch (error) {
      console.error('Error updating node:', error);
    }
    
    setIsNodeEditorOpen(false);
  };

  // Handle workflow change from canvas
  const handleWorkflowChange = (updatedFlowData: string) => {
    try {
      const updatedWorkflow = {
        ...workflowData,
        flowData: updatedFlowData,
        updatedAt: new Date().toISOString()
      };
      
      setWorkflowData(updatedWorkflow);
      
      // Update node and edge counts
      const flowData = JSON.parse(updatedFlowData);
      const nodes = flowData.nodes || [];
      const edges = flowData.edges || [];
      
      updatedWorkflow.nodeCount = nodes.length;
      updatedWorkflow.edgeCount = edges.length;
      
      // Recalculate complexity
      updatedWorkflow.complexityScore = calculateComplexityScore(nodes, edges);
      
      setWorkflowData({ ...updatedWorkflow });
    } catch (error) {
      console.error('Error handling workflow change:', error);
    }
  };

  // Handle workflow save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onSave?.(workflowData);
      
      // Show success message
      console.log('Workflow saved successfully');
    } catch (error) {
      console.error('Error saving workflow:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Analyze workflow complexity
  const analyzeWorkflow = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const flowData = JSON.parse(workflowData.flowData);
      const nodes = flowData.nodes || [];
      const edges = flowData.edges || [];
      
      // Calculate complexity metrics
      const analysis = {
        complexityScore: calculateComplexityScore(nodes, edges),
        bottlenecks: identifyBottlenecks(nodes, edges),
        optimizationSuggestions: generateOptimizationSuggestions(nodes, edges),
        performanceMetrics: {
          estimatedExecutionTime: estimateExecutionTime(nodes, edges),
          memoryUsage: estimateMemoryUsage(nodes),
          parallelizationPotential: calculateParallelizationPotential(nodes, edges)
        },
        validationResults: validateWorkflow(nodes, edges)
      };
      
      setAnalysisResults(analysis);
    } catch (error) {
      console.error('Error analyzing workflow:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Complexity calculation functions
  const calculateComplexityScore = (nodes: any[], edges: any[]): number => {
    let score = 0;
    
    // Base score for nodes
    score += nodes.length * 5;
    
    // Complexity by node type
    const typeWeights: {[key: string]: number} = {
      'Agent': 15,
      'LLM': 10,
      'Condition': 8,
      'Loop': 12,
      'Tool': 6,
      'Document': 4,
      'Memory': 3,
      'API': 8,
      'Start': 1
    };
    
    nodes.forEach(node => {
      score += typeWeights[node.data?.type] || 5;
    });
    
    // Edge complexity
    score += edges.length * 3;
    
    // Depth complexity
    const maxDepth = calculateMaxDepth(nodes, edges);
    score += maxDepth * 10;
    
    return Math.min(100, Math.round(score));
  };

  const calculateMaxDepth = (nodes: any[], edges: any[]): number => {
    // Simple depth calculation based on node positions
    const yPositions = nodes.map(n => n.position.y);
    const minY = Math.min(...yPositions);
    const maxY = Math.max(...yPositions);
    return Math.round((maxY - minY) / 100) + 1;
  };

  const identifyBottlenecks = (nodes: any[], edges: any[]): string[] => {
    const bottlenecks: string[] = [];
    
    // Find nodes with many connections
    const connectionCount: {[key: string]: number} = {};
    edges.forEach(edge => {
      connectionCount[edge.source] = (connectionCount[edge.source] || 0) + 1;
      connectionCount[edge.target] = (connectionCount[edge.target] || 0) + 1;
    });
    
    Object.entries(connectionCount).forEach(([nodeId, count]) => {
      if (count > 3) {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          bottlenecks.push(`${node.data?.label || nodeId} tem muitas conexões (${count})`);
        }
      }
    });
    
    return bottlenecks;
  };

  const generateOptimizationSuggestions = (nodes: any[], edges: any[]): string[] => {
    const suggestions: string[] = [];
    
    // Check for sequential LLM calls that could be parallelized
    const llmNodes = nodes.filter(n => n.data?.type === 'LLM');
    if (llmNodes.length > 2) {
      suggestions.push('Considere paralelizar chamadas LLM sequenciais');
    }
    
    // Check for missing error handling
    const hasErrorHandling = nodes.some(n => n.data?.type === 'Condition' && n.data?.label?.toLowerCase().includes('error'));
    if (!hasErrorHandling && nodes.length > 3) {
      suggestions.push('Adicione tratamento de erros para maior robustez');
    }
    
    // Check for memory optimization
    const memoryNodes = nodes.filter(n => n.data?.type === 'Memory');
    if (memoryNodes.length === 0 && nodes.length > 5) {
      suggestions.push('Considere adicionar nós de memória para manter contexto');
    }
    
    return suggestions;
  };

  const estimateExecutionTime = (nodes: any[], edges: any[]): string => {
    const baseTime = nodes.length * 0.5; // Base time per node
    const llmTime = nodes.filter(n => n.data?.type === 'LLM' || n.data?.type === 'Agent').length * 2;
    const totalTime = baseTime + llmTime;
    
    if (totalTime < 5) return '< 5s';
    if (totalTime < 15) return '5-15s';
    if (totalTime < 30) return '15-30s';
    return '> 30s';
  };

  const estimateMemoryUsage = (nodes: any[]): string => {
    const baseMemory = nodes.length * 10; // Base memory per node
    const llmMemory = nodes.filter(n => n.data?.type === 'LLM' || n.data?.type === 'Agent').length * 50;
    const totalMemory = baseMemory + llmMemory;
    
    if (totalMemory < 100) return '< 100MB';
    if (totalMemory < 500) return '100-500MB';
    return '> 500MB';
  };

  const calculateParallelizationPotential = (nodes: any[], edges: any[]): number => {
    // Simple heuristic based on independent branches
    let potential = 0;
    
    // Count independent branches (nodes that could run in parallel)
    const branchNodes = nodes.filter(n => 
      n.data?.type === 'LLM' || 
      n.data?.type === 'Agent' || 
      n.data?.type === 'Tool'
    );
    
    potential = Math.min(100, branchNodes.length * 20);
    return potential;
  };

  const validateWorkflow = (nodes: any[], edges: any[]): any => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for disconnected nodes
    const connectedNodes = new Set();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });
    
    nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && node.data?.type !== 'Start') {
        warnings.push(`Nó "${node.data?.label}" está desconectado`);
      }
    });
    
    // Check for missing start node
    const hasStartNode = nodes.some(n => n.data?.type === 'Start');
    if (!hasStartNode) {
      errors.push('Workflow não tem nó de início (Start)');
    }
    
    // Check for circular dependencies
    if (hasCircularDependencies(nodes, edges)) {
      errors.push('Workflow tem dependências circulares');
    }
    
    return { errors, warnings, isValid: errors.length === 0 };
  };

  const hasCircularDependencies = (nodes: any[], edges: any[]): boolean => {
    // Simple circular dependency detection
    // This is a basic implementation - in practice, you'd want a more robust algorithm
    return false;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl flex items-center gap-3">
                <Settings className="w-6 h-6 text-blue-600" />
                Editor Híbrido de Workflow
              </CardTitle>
              <div className="flex items-center gap-4">
                <Badge variant="outline">{workflowData.type}</Badge>
                <Badge variant="secondary">{workflowData.category || 'general'}</Badge>
                <WorkflowComplexityBadge score={workflowData.complexityScore} />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeWorkflow}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <BarChart3 className="w-4 h-4 mr-2" />
                )}
                Analisar
              </Button>
              
              {onPreview && (
                <Button variant="outline" size="sm" onClick={onPreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              )}
              
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              )}
              
              {onPublishToAgents && (
                <Button variant="outline" size="sm" onClick={onPublishToAgents}>
                  <Upload className="w-4 h-4 mr-2" />
                  Publicar
                </Button>
              )}
              
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Analysis Results */}
      {analysisResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Análise de Complexidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analysisResults.complexityScore}/100
                </div>
                <div className="text-sm text-gray-600">Complexidade</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analysisResults.performanceMetrics.estimatedExecutionTime}
                </div>
                <div className="text-sm text-gray-600">Tempo Estimado</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analysisResults.performanceMetrics.memoryUsage}
                </div>
                <div className="text-sm text-gray-600">Memória Estimada</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analysisResults.performanceMetrics.parallelizationPotential}%
                </div>
                <div className="text-sm text-gray-600">Potencial de Paralelização</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysisResults.bottlenecks.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Gargalos Identificados:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisResults.bottlenecks.map((bottleneck: string, index: number) => (
                        <li key={index} className="text-sm">{bottleneck}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {analysisResults.optimizationSuggestions.length > 0 && (
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Sugestões de Otimização:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisResults.optimizationSuggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-sm">{suggestion}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {analysisResults.validationResults.errors.length > 0 && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="font-medium mb-2">Erros de Validação:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {analysisResults.validationResults.errors.map((error: string, index: number) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {analysisResults.validationResults.warnings.length > 0 && (
              <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <div className="font-medium mb-2">Avisos:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {analysisResults.validationResults.warnings.map((warning: string, index: number) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Main Editor */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="canvas" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Canvas Visual
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Estrutura
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Capacidades
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="canvas" className="space-y-6">
          <DrawflowCanvas
            workflow={workflowData}
            onNodeClick={handleNodeClick}
            onEditNode={handleNodeEdit}
            onWorkflowChange={handleWorkflowChange}
            onSave={handleSave}
            onPreview={onPreview}
          />
        </TabsContent>
        
        <TabsContent value="structure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estrutura do Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Nós ({workflowData.nodeCount})</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {(() => {
                      try {
                        const flowData = JSON.parse(workflowData.flowData);
                        return flowData.nodes?.map((node: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <div className="font-medium">{node.data?.label || 'Nó sem nome'}</div>
                              <div className="text-sm text-gray-600">{node.data?.type}</div>
                            </div>
                            <Badge variant="outline">{node.type}</Badge>
                          </div>
                        ));
                      } catch {
                        return <div className="text-gray-500">Erro ao carregar estrutura</div>;
                      }
                    })()}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Conexões ({workflowData.edgeCount})</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {(() => {
                      try {
                        const flowData = JSON.parse(workflowData.flowData);
                        return flowData.edges?.map((edge: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div className="text-sm">
                              {edge.source} → {edge.target}
                            </div>
                            <div className="text-xs text-gray-500">conexão</div>
                          </div>
                        ));
                      } catch {
                        return <div className="text-gray-500">Erro ao carregar conexões</div>;
                      }
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="capabilities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Capacidades do Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="font-medium">Upload de Arquivos</div>
                    <div className="text-sm text-gray-600">
                      {workflowData.capabilities.canHandleFileUpload ? 'Sim' : 'Não'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Zap className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="font-medium">Streaming</div>
                    <div className="text-sm text-gray-600">
                      {workflowData.capabilities.hasStreaming ? 'Sim' : 'Não'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Users className="w-8 h-8 text-purple-600" />
                  <div>
                    <div className="font-medium">Multi-idioma</div>
                    <div className="text-sm text-gray-600">
                      {workflowData.capabilities.supportsMultiLanguage ? 'Sim' : 'Não'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Database className="w-8 h-8 text-orange-600" />
                  <div>
                    <div className="font-medium">Memória</div>
                    <div className="text-sm text-gray-600">
                      {workflowData.capabilities.hasMemory ? 'Sim' : 'Não'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Code className="w-8 h-8 text-red-600" />
                  <div>
                    <div className="font-medium">APIs Externas</div>
                    <div className="text-sm text-gray-600">
                      {workflowData.capabilities.usesExternalAPIs ? 'Sim' : 'Não'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <BarChart3 className="w-8 h-8 text-indigo-600" />
                  <div>
                    <div className="font-medium">Analytics</div>
                    <div className="text-sm text-gray-600">
                      {workflowData.capabilities.hasAnalytics ? 'Sim' : 'Não'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Target className="w-8 h-8 text-teal-600" />
                  <div>
                    <div className="font-medium">Processamento Paralelo</div>
                    <div className="text-sm text-gray-600">
                      {workflowData.capabilities.supportsParallelProcessing ? 'Sim' : 'Não'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  <div>
                    <div className="font-medium">Tratamento de Erros</div>
                    <div className="text-sm text-gray-600">
                      {workflowData.capabilities.hasErrorHandling ? 'Sim' : 'Não'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Node Editor Dialog */}
      <NodeEditorDialog
        open={isNodeEditorOpen}
        onOpenChange={setIsNodeEditorOpen}
        node={selectedNode}
        onSave={handleNodeSave}
      />
    </div>
  );
}