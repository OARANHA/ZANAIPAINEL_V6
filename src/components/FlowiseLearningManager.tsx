"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  Eye, 
  Edit, 
  CheckCircle,
  AlertTriangle,
  Brain,
  Target,
  Layers,
  Zap,
  Database,
  Settings,
  Filter,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import WorkflowVisualization from '@/components/workflow/WorkflowVisualization';

interface FlowiseWorkflow {
  id: string;
  name: string;
  type: 'CHATFLOW' | 'AGENTFLOW' | 'MULTIAGENT' | 'ASSISTANT';
  category: string;
  complexity: number;
  nodeCount: number;
  flowData: string; // JSON
  deployed: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LearnedTemplate {
  id: string;
  name: string;
  sourceWorkflowId: string;
  category: string;
  complexity: 'simple' | 'medium' | 'complex';
  patterns: {
    commonNodes: string[];
    connectionPatterns: string[];
    configPatterns: Record<string, any>;
  };
  zanaiConfig: {
    simpleDescription: string;
    requiredCapabilities: string[];
    estimatedSetupTime: string;
  };
  validated: boolean;
  usageCount: number;
  createdAt: string;
}

export default function FlowiseLearningManager() {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<FlowiseWorkflow[]>([]);
  const [templates, setTemplates] = useState<LearnedTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<FlowiseWorkflow | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<FlowiseWorkflow | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    minComplexity: '',
    maxComplexity: ''
  });

  useEffect(() => {
    loadWorkflows();
    loadTemplates();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      // Buscar workflows que foram enviados para o learning (não direto do flowise)
      const response = await fetch('/api/v1/learning/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_sent_workflows',
          data: { source: 'flowise_workflows' }
        })
      });

      const result = await response.json();
      if (result.success) {
        const workflowsData = result.workflows || [];
        const formattedWorkflows = workflowsData.map((wf: any) => ({
          id: wf.id,
          name: wf.name,
          type: wf.type || 'CHATFLOW',
          category: wf.category || 'general',
          complexity: wf.complexityScore || calculateComplexity(wf.flowData),
          nodeCount: wf.nodeCount || countNodes(wf.flowData),
          flowData: wf.flowData || '{}',
          deployed: wf.deployed || false,
          isPublic: wf.isPublic || false,
          createdAt: wf.createdAt || new Date().toISOString(),
          updatedAt: wf.updatedAt || new Date().toISOString(),
          sentToLearning: wf.sentToLearning || true,
          analysisStatus: wf.analysisStatus || 'pending',
          analysisResult: wf.analysisResult || null
        }));
        setWorkflows(formattedWorkflows);
      } else {
        throw new Error(result.error || 'Failed to load workflows');
      }
    } catch (error) {
      console.error('Erro ao carregar workflows:', error);
      toast({
        title: "Erro ao carregar workflows",
        description: "Não foi possível carregar os workflows enviados para o Learning.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/v1/learning/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const confirmImport = (workflow: FlowiseWorkflow) => {
    setPendingImport(workflow);
  };

  const importWorkflow = async (workflow: FlowiseWorkflow) => {
    setImporting(workflow.id);
    setPendingImport(null);
    try {
      // Show initial feedback
      console.log(`Iniciando importação do workflow: ${workflow.name}`);
      
      // Analisar o workflow para extrair padrões
      const analysisResponse = await fetch('/api/v1/learning/flowise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflow.id,
          flowData: workflow.flowData,
          type: workflow.type
        })
      });

      const analysisResult = await analysisResponse.json();
      
      if (analysisResult.success) {
        // Create template with the analysis results
        const templateResponse = await fetch('/api/v1/learning/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceWorkflowId: workflow.id,
            name: workflow.name,
            category: workflow.category,
            complexity: workflow.complexity > 10 ? 'complex' : workflow.complexity > 5 ? 'medium' : 'simple',
            patterns: analysisResult.patterns,
            zanaiConfig: analysisResult.zanaiConfig
          })
        });

        if (templateResponse.ok) {
          const templateData = await templateResponse.json();
          
          // Show detailed success message
          toast({
            title: "✅ Workflow importado com sucesso!",
            description: (
              <div className="space-y-2">
                <p><strong>{workflow.name}</strong> foi analisado e transformado em template.</p>
                <div className="text-sm text-muted-foreground">
                  <p>• <strong>Destino:</strong> Sistema de Aprendizado (Templates)</p>
                  <p>• <strong>Complexidade:</strong> {workflow.complexity > 10 ? 'Complexa' : workflow.complexity > 5 ? 'Média' : 'Simples'}</p>
                  <p>• <strong>Template ID:</strong> {templateData.template?.id}</p>
                  <p>• <strong>Status:</strong> Pronto para validação</p>
                  <p>• <strong>Localização:</strong> Disponível na aba "Templates Aprendidos"</p>
                </div>
              </div>
            ),
            duration: 6000,
          });
          
          // Refresh templates list
          await loadTemplates();
          
          // Log the successful import
          console.log(`Workflow "${workflow.name}" importado com sucesso. Template ID: ${templateData.template?.id}`);
        } else {
          throw new Error('Falha ao criar template');
        }
      } else {
        throw new Error(analysisResult.error || 'Falha na análise do workflow');
      }
    } catch (error) {
      console.error('Erro ao importar workflow:', error);
      
      // Show detailed error message
      toast({
        title: "❌ Erro ao importar workflow",
        description: (
          <div className="space-y-2">
            <p>Não foi possível importar o workflow <strong>{workflow.name}</strong>.</p>
            <div className="text-sm text-muted-foreground">
              <p>• <strong>Erro:</strong> {error instanceof Error ? error.message : 'Erro desconhecido'}</p>
              <p>• <strong>Destino pretendido:</strong> Sistema de Aprendizado</p>
              <p>• <strong>Solução:</strong> Verifique se o workflow possui dados válidos</p>
              <p>• <strong>Ação:</strong> Tente novamente ou contate o suporte</p>
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setImporting(null);
    }
  };

  const analyzePatterns = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/v1/flowise-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_all_patterns',
          data: {}
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Análise concluída!",
          description: `${result.patternsFound} padrões encontrados em ${result.workflowsAnalyzed} workflows.`,
        });
        await loadTemplates();
      }
    } catch (error) {
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar os padrões dos workflows.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const validateTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/v1/learning/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validated: true })
      });

      if (response.ok) {
        toast({
          title: "Template validado!",
          description: "O template foi validado e marcado como pronto para uso.",
        });
        await loadTemplates();
      }
    } catch (error) {
      toast({
        title: "Erro na validação",
        description: "Não foi possível validar o template.",
        variant: "destructive",
      });
    }
  };

  const performDeepAnalysis = async (workflow: FlowiseWorkflow) => {
    try {
      const response = await fetch('/api/v1/learning/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deep_analysis',
          data: {
            workflowId: workflow.id,
            flowData: workflow.flowData,
            includePerformance: true,
            includeSecurity: true,
            includeOptimization: true
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Análise detalhada concluída!",
          description: `Análise de ${workflow.name} concluída com ${result.insights.length} insights.`,
        });
        await loadWorkflows(); // Refresh to show analysis status
      } else {
        throw new Error(result.error || 'Falha na análise detalhada');
      }
    } catch (error) {
      toast({
        title: "Erro na análise",
        description: "Não foi possível realizar a análise detalhada.",
        variant: "destructive",
      });
    }
  };

  const generateOptimizationSuggestions = async (workflow: FlowiseWorkflow) => {
    try {
      const response = await fetch('/api/v1/learning/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_optimizations',
          data: {
            workflowId: workflow.id,
            flowData: workflow.flowData,
            currentComplexity: workflow.complexity
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Sugestões de otimização geradas!",
          description: `${result.suggestions.length} sugestões geradas para ${workflow.name}.`,
        });
      } else {
        throw new Error(result.error || 'Falha ao gerar sugestões');
      }
    } catch (error) {
      toast({
        title: "Erro ao gerar sugestões",
        description: "Não foi possível gerar sugestões de otimização.",
        variant: "destructive",
      });
    }
  };

  const exportToStudio = async (workflow: FlowiseWorkflow) => {
    try {
      const response = await fetch('/api/v1/studio/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import_from_learning',
          data: {
            workflow: workflow,
            source: 'learning'
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Exportado para Studio!",
          description: `Workflow ${workflow.name} exportado para o Studio com sucesso.`,
        });
        // Redirecionar para o studio após exportação
        setTimeout(() => {
          window.location.href = '/admin/studio';
        }, 1500);
      } else {
        throw new Error(result.error || 'Falha ao exportar para Studio');
      }
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar para o Studio.",
        variant: "destructive",
      });
    }
  };

  const calculateComplexity = (flowData: string): number => {
    try {
      const data = JSON.parse(flowData);
      const nodes = data.nodes || [];
      const edges = data.edges || [];
      
      // Calcular complexidade baseada em nodes, edges e tipos
      let complexity = nodes.length * 1;
      complexity += edges.length * 0.5;
      
      // Adicionar peso por tipos complexos
      nodes.forEach((node: any) => {
        if (node.data?.category === 'agents') complexity += 2;
        if (node.data?.category === 'tools') complexity += 1.5;
        if (node.data?.category === 'documentloaders') complexity += 1;
      });
      
      return Math.round(complexity);
    } catch {
      return 1;
    }
  };

  const countNodes = (flowData: string): number => {
    try {
      const data = JSON.parse(flowData);
      return data.nodes?.length || 0;
    } catch {
      return 0;
    }
  };

  const getComplexityColor = (complexity: number) => {
    if (complexity <= 5) return 'bg-green-100 text-green-800';
    if (complexity <= 15) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getComplexityLabel = (complexity: number) => {
    if (complexity <= 5) return 'Simples';
    if (complexity <= 15) return 'Médio';
    return 'Complexo';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flowise Learning Manager</h1>
          <p className="text-muted-foreground">
            Aprenda com workflows reais do Flowise e crie templates validados
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadWorkflows} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={analyzePatterns} disabled={analyzing}>
            <Brain className="w-4 h-4 mr-2" />
            Analisar Padrões
          </Button>
        </div>
      </div>

      <Tabs defaultValue="workflows" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workflows">Workflows Flowise</TabsTrigger>
          <TabsTrigger value="templates">Templates Aprendidos</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Workflows Enviados para Análise
              </CardTitle>
              <CardDescription>
                Workflows recebidos do flowise-workflows para análise detalhada e otimização
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Carregando workflows...</span>
                </div>
              ) : workflows.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum workflow enviado</h3>
                  <p className="text-muted-foreground mb-4">
                    Nenhum workflow foi enviado para análise ainda. 
                    Envie workflows do flowise-workflows para que eles apareçam aqui.
                  </p>
                  <a href="/admin/flowise-workflows" className="inline-block">
                    <Button>
                      Ir para Flowise Workflows
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="grid gap-4">
                  {workflows.map((workflow) => (
                    <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{workflow.name}</h3>
                              <Badge variant="outline">{workflow.type}</Badge>
                              <Badge variant="secondary">{workflow.category}</Badge>
                              <Badge className={getComplexityColor(workflow.complexity)}>
                                {getComplexityLabel(workflow.complexity)}
                              </Badge>
                              {/* Status de Análise */}
                              {(workflow as any).analysisStatus && (
                                <Badge 
                                  className={
                                    (workflow as any).analysisStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                    (workflow as any).analysisStatus === 'analyzing' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {(workflow as any).analysisStatus === 'completed' ? 'Analisado' :
                                   (workflow as any).analysisStatus === 'analyzing' ? 'Analisando' :
                                   'Pendente'}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {workflow.nodeCount} nodes • Complexidade: {workflow.complexity}
                            </div>
                            {/* Mostrar resultados da análise se disponível */}
                            {(workflow as any).analysisResult && (
                              <div className="bg-muted p-2 rounded text-xs">
                                <div className="flex items-center gap-2 mb-1">
                                  <Brain className="w-3 h-3" />
                                  <span className="font-medium">Análise:</span>
                                </div>
                                <div className="space-y-1">
                                  <div>Performance: {(workflow as any).analysisResult.performanceScore}/100</div>
                                  <div>Segurança: {(workflow as any).analysisResult.securityScore}/100</div>
                                  <div>Otimizações: {(workflow as any).analysisResult.optimizationCount} sugestões</div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedWorkflow(workflow)}
                            >
                              <Eye className="w-4 h-4" />
                              Detalhes
                            </Button>
                            <WorkflowVisualization workflow={workflow} />
                            
                            {/* Análise Detalhada */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => performDeepAnalysis(workflow)}
                              disabled={(workflow as any).analysisStatus === 'analyzing'}
                            >
                              <Brain className="w-4 h-4" />
                              Análise
                            </Button>
                            
                            {/* Otimização */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateOptimizationSuggestions(workflow)}
                            >
                              <Target className="w-4 h-4" />
                              Otimizar
                            </Button>
                            
                            {/* Importar como Template */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => confirmImport(workflow)}
                                  disabled={importing === workflow.id}
                                >
                                  {importing === workflow.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                  Template
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Criar Template</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <div className="space-y-3">
                                      <p>Transformar o workflow <strong>{workflow.name}</strong> em um template aprendido?</p>
                                      
                                      <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                          <Database className="w-4 h-4" />
                                          <span><strong>Origem:</strong> Flowise Workflows</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Brain className="w-4 h-4" />
                                          <span><strong>Destino:</strong> Templates Aprendidos</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Target className="w-4 h-4" />
                                          <span><strong>Complexidade:</strong> {getComplexityLabel(workflow.complexity)}</span>
                                        </div>
                                      </div>
                                      
                                      <p>O template será criado com base na análise do workflow e ficará disponível para uso futuro.</p>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => pendingImport && importWorkflow(pendingImport)}
                                    disabled={importing !== null}
                                  >
                                    {importing ? 'Criando...' : 'Criar Template'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            {/* Exportar para Studio */}
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                              onClick={() => exportToStudio(workflow)}
                              disabled={(workflow as any).analysisStatus !== 'completed'}
                            >
                              <Upload className="w-4 h-4" />
                              Studio
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Templates Aprendidos
              </CardTitle>
              <CardDescription>
                Templates criados a partir da análise de workflows reais do Flowise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{template.name}</h3>
                            <Badge variant="outline">{template.category}</Badge>
                            <Badge 
                              className={
                                template.complexity === 'simple' ? 'bg-green-100 text-green-800' :
                                template.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {template.complexity}
                            </Badge>
                            {template.validated && (
                              <Badge className="bg-blue-100 text-blue-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Validado
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {template.zanaiConfig.simpleDescription}
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Uso: {template.usageCount}x</span>
                            <span>Setup: {template.zanaiConfig.estimatedSetupTime}</span>
                            <span>Nodes: {template.patterns.commonNodes.length}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => validateTemplate(template.id)}
                            disabled={template.validated}
                          >
                            {template.validated ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Target className="w-4 h-4" />
                            )}
                            {template.validated ? 'Validado' : 'Validar'}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}