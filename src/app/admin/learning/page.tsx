'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, 
  BarChart3, 
  Target, 
  TrendingUp, 
  Brain, 
  Workflow, 
  Users, 
  Database,
  Play,
  Save,
  Upload,
  Download,
  Settings,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Zap,
  FileText,
  Code,
  Shield,
  ArrowLeft,
  Plus,
  Filter,
  Search,
  Info,
  Activity,
  Layers,
  GitBranch,
  Cpu,
  Network,
  Timer,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import ElegantCard from '@/components/ui/ElegantCard';
import FlowiseLearningManager from '@/components/FlowiseLearningManager';
import HybridWorkflowEditor from '@/components/workflow/HybridWorkflowEditor';
import WorkflowComplexityBadge from '@/components/workflow/WorkflowComplexityBadge';
import WorkflowVisualization from '@/components/workflow/WorkflowVisualization';

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

interface LearningStats {
  totalExecutions: number;
  successRate: number;
  averageResponseTime: number;
  activeAgents: number;
  learnedTemplates: number;
  validatedTemplates: number;
  flowiseWorkflows: number;
}

export default function LearningPage() {
  const pathname = usePathname();
  const [stats, setStats] = useState<LearningStats>({
    totalExecutions: 0,
    successRate: 100,
    averageResponseTime: 1.2,
    activeAgents: 0,
    learnedTemplates: 0,
    validatedTemplates: 0,
    flowiseWorkflows: 0
  });

  // Workflow selection and editing state
  const [availableWorkflows, setAvailableWorkflows] = useState<FlowiseWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<FlowiseWorkflow | null>(null);
  const [detailsWorkflow, setDetailsWorkflow] = useState<FlowiseWorkflow | null>(null);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadStats();
    loadAvailableWorkflows();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        const agents = data.agents || [];
        setStats(prev => ({
          ...prev,
          activeAgents: Array.isArray(agents) ? agents.filter(agent => agent.status === 'active').length : 0
        }));
      }

      const templatesResponse = await fetch('/api/v1/learning/templates');
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        const templates = templatesData.templates || [];
        setStats(prev => ({
          ...prev,
          learnedTemplates: templates.length,
          validatedTemplates: templates.filter(t => t.validated).length
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadAvailableWorkflows = async () => {
    setIsLoadingWorkflows(true);
    try {
      const response = await fetch('/api/v1/flowise-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_workflows',
          data: { page: 1, limit: 50 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const workflows = data.workflows || [];
        setAvailableWorkflows(workflows);
        setStats(prev => ({
          ...prev,
          flowiseWorkflows: workflows.length
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar workflows:', error);
    } finally {
      setIsLoadingWorkflows(false);
    }
  };

  const handleWorkflowSelect = (workflow: FlowiseWorkflow) => {
    // Validate workflow before selection
    if (!workflow.id || !workflow.name || !workflow.flowData) {
      alert('Workflow inválido: dados incompletos');
      return;
    }
    
    if (workflow.complexityScore > 50) {
      const confirmSelect = confirm(
        `Este workflow tem alta complexidade (${workflow.complexityScore}). Deseja continuar com a edição?`
      );
      if (!confirmSelect) return;
    }
    
    setSelectedWorkflow(workflow);
    setIsWorkflowDialogOpen(false);
    
    // Show success message
    console.log('Workflow selecionado com sucesso:', workflow.name);
  };

  const handleWorkflowDetails = (workflow: FlowiseWorkflow) => {
    setDetailsWorkflow(workflow);
    setIsDetailsDialogOpen(true);
  };

  const handleWorkflowSave = async (updatedWorkflow: FlowiseWorkflow) => {
    try {
      // Simulate saving workflow
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the workflow in the list
      setAvailableWorkflows(prev => 
        prev.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w)
      );
      
      setSelectedWorkflow(updatedWorkflow);
      console.log('Workflow salvo com sucesso:', updatedWorkflow.name);
    } catch (error) {
      console.error('Erro ao salvar workflow:', error);
    }
  };

  const handleExportToStudio = async () => {
    if (!selectedWorkflow) return;
    
    // Validate workflow before export
    if (!selectedWorkflow.flowData || selectedWorkflow.flowData === '{}') {
      alert('Não é possível exportar: workflow não possui dados válidos');
      return;
    }
    
    if (selectedWorkflow.nodeCount === 0) {
      alert('Não é possível exportar: workflow não possui nós');
      return;
    }
    
    try {
      // Real export to studio
      const response = await fetch('/api/v1/studio/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import_workflow',
          data: {
            workflow: selectedWorkflow,
            source: 'flowise_learning'
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Workflow exportado para o studio:', selectedWorkflow.name);
        alert(`Workflow "${selectedWorkflow.name}" exportado para o Studio com sucesso!`);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Erro ao exportar workflow:', error);
      alert(`Erro ao exportar workflow: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handlePublishToAgents = async () => {
    if (!selectedWorkflow) return;
    
    // Validate workflow before publishing
    if (!selectedWorkflow.flowData || selectedWorkflow.flowData === '{}') {
      alert('Não é possível publicar: workflow não possui dados válidos');
      return;
    }
    
    if (selectedWorkflow.nodeCount === 0) {
      alert('Não é possível publicar: workflow não possui nós');
      return;
    }
    
    if (!selectedWorkflow.deployed) {
      const confirmPublish = confirm(
        'Este workflow não está deployed no Flowise. Deseja publicar mesmo assim?'
      );
      if (!confirmPublish) return;
    }
    
    try {
      // Real publish to agents
      const response = await fetch('/api/v1/agents/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: selectedWorkflow,
          source: 'flowise_learning'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Workflow publicado para agentes:', selectedWorkflow.name);
        alert(`Workflow "${selectedWorkflow.name}" publicado para agentes com sucesso!\n${result.message || ''}`);
      } else {
        throw new Error(result.error || 'Publish failed');
      }
    } catch (error) {
      console.error('Erro ao publicar workflow:', error);
      alert(`Erro ao publicar workflow: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const filteredWorkflows = availableWorkflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (workflow.description && workflow.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || workflow.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <MainLayout currentPath={pathname}>
      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ElegantCard
            title="Workflows Disponíveis"
            description="Do Flowise"
            icon={Workflow}
            iconColor="text-blue-600"
            bgColor="bg-blue-100 dark:bg-blue-900/20"
            value={stats.flowiseWorkflows}
            badge="Prontos para editar"
            badgeColor="bg-blue-50 text-blue-700 border-blue-200"
          />
          
          <ElegantCard
            title="Templates Aprendidos"
            description="Do Flowise"
            icon={Brain}
            iconColor="text-purple-600"
            bgColor="bg-purple-100 dark:bg-purple-900/20"
            value={stats.learnedTemplates}
            badge={`${stats.validatedTemplates} validados`}
            badgeColor="bg-purple-50 text-purple-700 border-purple-200"
          />
          
          <ElegantCard
            title="Agentes Ativos"
            description="Em operação"
            icon={Users}
            iconColor="text-orange-600"
            bgColor="bg-orange-100 dark:bg-orange-900/20"
            value={stats.activeAgents}
            badge={stats.activeAgents > 0 ? "Prontos para uso" : undefined}
            badgeColor="bg-orange-50 text-orange-700 border-orange-200"
          />
          
          <ElegantCard
            title="Taxa de Sucesso"
            description="Média de acertos"
            icon={Target}
            iconColor="text-green-600"
            bgColor="bg-green-100 dark:bg-green-900/20"
            value={`${stats.successRate}%`}
            badge="Excelente desempenho"
            badgeColor="bg-green-50 text-green-700 border-green-200"
          />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sistema de Aprendizado</h1>
            <p className="text-lg text-muted-foreground">
              Edite workflows do Flowise e aperfeiçoe-os para publicação
            </p>
          </div>
          
          {!selectedWorkflow ? (
            <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Selecionar Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Selecionar Workflow para Edição</DialogTitle>
                  <DialogDescription>
                    Escolha um workflow do Flowise para editar e aperfeiçoar
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar workflows..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="CHATFLOW">ChatFlow</SelectItem>
                        <SelectItem value="AGENTFLOW">AgentFlow</SelectItem>
                        <SelectItem value="MULTIAGENT">MultiAgent</SelectItem>
                        <SelectItem value="ASSISTANT">Assistant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Workflow List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {isLoadingWorkflows ? (
                      <div className="text-center py-8">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Carregando workflows...</p>
                      </div>
                    ) : filteredWorkflows.length === 0 ? (
                      <div className="text-center py-8">
                        <Workflow className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Nenhum workflow encontrado</p>
                      </div>
                    ) : (
                      filteredWorkflows.map((workflow) => (
                        <Card 
                          key={workflow.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleWorkflowSelect(workflow)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-medium">{workflow.name}</h3>
                                  <Badge variant="outline">{workflow.type}</Badge>
                                  <WorkflowComplexityBadge score={workflow.complexityScore} />
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {workflow.description || 'Sem descrição'}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>{workflow.nodeCount} nós</span>
                                  <span>{workflow.edgeCount} conexões</span>
                                  <span>Profundidade: {workflow.maxDepth}</span>
                                  {workflow.deployed && (
                                    <Badge variant="secondary" className="text-xs">Deployed</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <div onClick={(e) => e.stopPropagation()}>
                                  <WorkflowVisualization workflow={workflow} />
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWorkflowDetails(workflow);
                                  }}
                                >
                                  <Info className="w-4 h-4 mr-1" />
                                  Detalhes
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWorkflowSelect(workflow);
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Selecionar
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSelectedWorkflow(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button 
                variant="outline"
                onClick={handleExportToStudio}
              >
                <Upload className="w-4 h-4 mr-2" />
                Exportar para Studio
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                onClick={handlePublishToAgents}
              >
                <Users className="w-4 h-4 mr-2" />
                Publicar para Agentes
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        {!selectedWorkflow ? (
          /* Default Learning View */
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="flowise" className="flex items-center gap-2">
                <Workflow className="w-4 h-4" />
                Flowise Learning
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Agentes
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Learning Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ElegantCard
                  title="Análise de Desempenho"
                  description="Acompanhe métricas detalhadas de performance de cada workflow"
                  icon={BarChart3}
                  iconColor="text-blue-600"
                  bgColor="bg-blue-100 dark:bg-blue-900/20"
                  badge="Em tempo real"
                  badgeColor="bg-blue-50 text-blue-700 border-blue-200"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Precisão</span>
                      <span className="font-medium text-blue-600">94%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Velocidade</span>
                      <span className="font-medium text-green-600">1.2s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Satisfação</span>
                      <span className="font-medium text-purple-600">4.8/5</span>
                    </div>
                  </div>
                </ElegantCard>

                <ElegantCard
                  title="Otimização Automática"
                  description="Melhorias automáticas baseadas em padrões de uso"
                  icon={Target}
                  iconColor="text-green-600"
                  bgColor="bg-green-100 dark:bg-green-900/20"
                  badge="Inteligente"
                  badgeColor="bg-green-50 text-green-700 border-green-200"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Otimizações</span>
                      <span className="font-medium text-blue-600">23</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Melhorias</span>
                      <span className="font-medium text-green-600">+15%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Eficiência</span>
                      <span className="font-medium text-purple-600">89%</span>
                    </div>
                  </div>
                </ElegantCard>

                <ElegantCard
                  title="Evolução Contínua"
                  description="Aprendizado contínuo e adaptação a novos cenários"
                  icon={TrendingUp}
                  iconColor="text-purple-600"
                  bgColor="bg-purple-100 dark:bg-purple-900/20"
                  badge="Adaptativo"
                  badgeColor="bg-purple-50 text-purple-700 border-purple-200"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Atualizações</span>
                      <span className="font-medium text-blue-600">12</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Novas Habilidades</span>
                      <span className="font-medium text-green-600">8</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Adaptação</span>
                      <span className="font-medium text-purple-600">96%</span>
                    </div>
                  </div>
                </ElegantCard>
              </div>

              {/* Recent Activity */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Atividade Recente</CardTitle>
                  <CardDescription>
                    Últimas atualizações e melhorias do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Workflow otimizado automaticamente</p>
                        <p className="text-xs text-muted-foreground">Combinação Soft.Eng.+Revisor Codigo - melhoria de 12% na precisão</p>
                      </div>
                      <span className="text-xs text-muted-foreground">2 min atrás</span>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Novo padrão identificado</p>
                        <p className="text-xs text-muted-foreground">Padrão de otimização de API detectado e aplicado</p>
                      </div>
                      <span className="text-xs text-muted-foreground">15 min atrás</span>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Template Flowise validado</p>
                        <p className="text-xs text-muted-foreground">Customer Support Bot - template pronto para uso</p>
                      </div>
                      <span className="text-xs text-muted-foreground">1 hora atrás</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flowise">
              <FlowiseLearningManager />
            </TabsContent>

            <TabsContent value="agents" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Aprendizado de Agentes</CardTitle>
                  <CardDescription>
                    Gerencie o aprendizado e otimização dos seus agentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Gerenciamento de Agentes</h3>
                    <p className="text-muted-foreground mb-4">
                      Aqui você poderá gerenciar o aprendizado individual de cada agente, 
                      acompanhar métricas de performance e configurar otimizações automáticas.
                    </p>
                    <Button variant="outline">
                      Em breve disponível
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Analytics de Aprendizado</CardTitle>
                  <CardDescription>
                    Análise detalhada do desempenho do sistema de aprendizado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Database className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Análise Avançada</h3>
                    <p className="text-muted-foreground mb-4">
                      Relatórios detalhados, gráficos de evolução e insights 
                      sobre o desempenho do sistema de aprendizado.
                    </p>
                    <Button variant="outline">
                      Em breve disponível
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          /* Workflow Editor View */
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você está editando o workflow <strong>{selectedWorkflow.name}</strong>. 
                Todas as alterações serão salvas automaticamente e poderão ser exportadas para o Studio.
              </AlertDescription>
            </Alert>
            
            <HybridWorkflowEditor
              workflow={selectedWorkflow}
              onSave={handleWorkflowSave}
              onExport={handleExportToStudio}
              onPublishToAgents={handlePublishToAgents}
            />
          </div>
        )}
      </div>

      {/* Workflow Details Modal */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Análise Detalhada do Workflow
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre a estrutura, complexidade e capacidades do workflow
            </DialogDescription>
          </DialogHeader>

          {detailsWorkflow && (
            <div className="space-y-6">
              {/* Header Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Nome</Label>
                      <p className="text-lg font-semibold">{detailsWorkflow.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Descrição</Label>
                      <p className="text-muted-foreground">
                        {detailsWorkflow.description || 'Sem descrição disponível'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Tipo</Label>
                        <Badge variant="outline" className="mt-1">
                          {detailsWorkflow.type}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Categoria</Label>
                        <Badge variant="secondary" className="mt-1">
                          {detailsWorkflow.category || 'general'}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-1">
                          {detailsWorkflow.deployed ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Deployed
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Não Deployed
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Acesso</Label>
                        <div className="mt-1">
                          {detailsWorkflow.isPublic ? (
                            <Badge className="bg-blue-100 text-blue-800">
                              Público
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Privado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Análise de Complexidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {detailsWorkflow.complexityScore}/100
                      </div>
                      <Badge 
                        className={
                          detailsWorkflow.complexityScore <= 33 
                            ? 'bg-green-100 text-green-800' 
                            : detailsWorkflow.complexityScore <= 66 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {detailsWorkflow.complexityScore <= 33 ? 'Baixa' : 
                         detailsWorkflow.complexityScore <= 66 ? 'Média' : 'Alta'} Complexidade
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-muted rounded-lg">
                        <Layers className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                        <div className="text-2xl font-bold">{detailsWorkflow.nodeCount}</div>
                        <div className="text-xs text-muted-foreground">Nós</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <GitBranch className="w-6 h-6 mx-auto mb-2 text-green-600" />
                        <div className="text-2xl font-bold">{detailsWorkflow.edgeCount}</div>
                        <div className="text-xs text-muted-foreground">Conexões</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <Cpu className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <div className="text-2xl font-bold">{detailsWorkflow.maxDepth}</div>
                        <div className="text-xs text-muted-foreground">Profundidade</div>
                      </div>
                    </div>

                    {detailsWorkflow.complexityScore > 50 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Este workflow possui alta complexidade e pode requerer mais tempo para desenvolvimento e otimização.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Capabilities Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Capacidades e Recursos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      try {
                        const capabilities = typeof detailsWorkflow.capabilities === 'string' 
                          ? JSON.parse(detailsWorkflow.capabilities) 
                          : detailsWorkflow.capabilities || {};
                        
                        const capabilityItems = [
                          { key: 'canHandleFileUpload', label: 'Upload de Arquivos', icon: FileText },
                          { key: 'hasStreaming', label: 'Streaming', icon: Activity },
                          { key: 'supportsMultiLanguage', label: 'Multi-idioma', icon: Network },
                          { key: 'hasMemory', label: 'Memória', icon: Database },
                          { key: 'usesExternalAPIs', label: 'APIs Externas', icon: Code },
                          { key: 'hasAnalytics', label: 'Analytics', icon: BarChart3 },
                          { key: 'supportsParallelProcessing', label: 'Processamento Paralelo', icon: Cpu },
                          { key: 'hasErrorHandling', label: 'Tratamento de Erros', icon: Shield }
                        ];

                        return capabilityItems.map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center gap-2 p-3 border rounded-lg">
                            {capabilities[key] ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <Icon className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-4 h-4 border border-gray-300 rounded" />
                                <Icon className="w-4 h-4" />
                              </div>
                            )}
                            <span className="text-sm">{label}</span>
                          </div>
                        ));
                      } catch (error) {
                        return <div className="col-span-full text-center text-muted-foreground">Erro ao carregar capacidades</div>;
                      }
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Technical Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Timer className="w-5 h-5" />
                    Informações Técnicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Data de Criação</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(detailsWorkflow.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Última Atualização</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(detailsWorkflow.updatedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {detailsWorkflow.lastSyncAt && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Última Sincronização</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(detailsWorkflow.lastSyncAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">ID do Flowise</span>
                        <span className="text-sm text-muted-foreground font-mono">
                          {detailsWorkflow.flowiseId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">ID Interno</span>
                        <span className="text-sm text-muted-foreground font-mono">
                          {detailsWorkflow.id}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {detailsWorkflow.complexityScore > 66 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Alta Complexidade:</strong> Considere dividir este workflow em componentes menores ou simplificar a lógica antes do desenvolvimento.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {detailsWorkflow.nodeCount > 15 && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Muitos Nós:</strong> Workflow com muitos nós pode beneficiar-se de otimização de performance e revisão de arquitetura.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {!detailsWorkflow.deployed && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Não Deployed:</strong> Este workflow não está ativo no Flowise. Verifique se está pronto para produção antes de importar.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {detailsWorkflow.complexityScore <= 33 && detailsWorkflow.deployed && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Ótimo Candidato:</strong> Este workflow tem baixa complexidade e está deployed, ideal para desenvolvimento no Studio.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Complexidade: {detailsWorkflow.complexityScore}/100 • 
                  {detailsWorkflow.nodeCount} nós • 
                  {detailsWorkflow.edgeCount} conexões
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDetailsDialogOpen(false)}
                  >
                    Fechar
                  </Button>
                  <Button 
                    onClick={() => {
                      handleWorkflowSelect(detailsWorkflow);
                      setIsDetailsDialogOpen(false);
                    }}
                    disabled={detailsWorkflow.complexityScore > 66}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Selecionar para Edição
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}