"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      const response = await fetch('/api/flowise-external-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_workflows' })
      });

      const result = await response.json();
      if (result.success) {
        const externalWorkflows = result.data || [];
        const formattedWorkflows = externalWorkflows.map((wf: any) => ({
          id: wf.id,
          name: wf.name,
          type: wf.type || 'CHATFLOW',
          category: wf.category || 'general',
          complexity: calculateComplexity(wf.flowData),
          nodeCount: countNodes(wf.flowData),
          flowData: wf.flowData || '{}',
          deployed: wf.deployed || false,
          isPublic: wf.isPublic || false,
          createdAt: wf.createdDate || new Date().toISOString(),
          updatedAt: wf.updatedDate || new Date().toISOString()
        }));
        setWorkflows(formattedWorkflows);
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar workflows",
        description: "Não foi possível carregar os workflows do Flowise.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/v1/flowise-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_learned_templates',
          data: {}
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const importWorkflow = async (workflow: FlowiseWorkflow) => {
    setImporting(workflow.id);
    try {
      // Analisar o workflow para extrair padrões
      const analysisResponse = await fetch('/api/v1/flowise-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_workflow',
          data: {
            workflowId: workflow.id,
            flowData: workflow.flowData,
            type: workflow.type
          }
        })
      });

      const analysisResult = await analysisResponse.json();
      
      if (analysisResult.success) {
        // Criar template aprendido
        const templateResponse = await fetch('/api/v1/flowise-workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_learned_template',
            data: {
              sourceWorkflowId: workflow.id,
              name: workflow.name,
              category: workflow.category,
              complexity: workflow.complexity > 10 ? 'complex' : workflow.complexity > 5 ? 'medium' : 'simple',
              patterns: analysisResult.patterns,
              zanaiConfig: analysisResult.zanaiConfig
            }
          })
        });

        if (templateResponse.ok) {
          toast({
            title: "Workflow importado com sucesso!",
            description: `O workflow "${workflow.name}" foi analisado e transformado em template.`,
          });
          await loadTemplates();
        }
      }
    } catch (error) {
      toast({
        title: "Erro ao importar workflow",
        description: `Não foi possível importar o workflow "${workflow.name}".`,
        variant: "destructive",
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
      const response = await fetch('/api/v1/flowise-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_template',
          data: { templateId }
        })
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
                Workflows Disponíveis no Flowise
              </CardTitle>
              <CardDescription>
                Importe workflows reais do Flowise para análise e criação de templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Carregando workflows...</span>
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
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {workflow.nodeCount} nodes • Complexidade: {workflow.complexity}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedWorkflow(workflow)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => importWorkflow(workflow)}
                              disabled={importing === workflow.id}
                            >
                              {importing === workflow.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                              Importar
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