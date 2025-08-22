'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NodeModifierInterface from '@/components/workflow/NodeModifierInterface';
import WorkflowValidationInterface from '@/components/workflow/WorkflowValidationInterface';
import LLMModelInterface from '@/components/workflow/LLMModelInterface';
import { FlowiseNode, FlowiseEdge } from '@/lib/agent-to-flowise-transformer';
import { 
  Workflow, 
  Settings, 
  Brain, 
  BarChart3, 
  ArrowLeft,
  Play,
  Save,
  RefreshCw,
  Plus,
  Zap,
  Target,
  Database,
  Cpu,
  Eye
} from 'lucide-react';
import Link from 'next/link';

// Dados de exemplo para demonstração
const sampleNodes: FlowiseNode[] = [
  {
    id: 'chatOpenAI_0',
    type: 'customNode',
    position: { x: 74.4955, y: 35.2848 },
    positionAbsolute: { x: 74.4955, y: 35.2848 },
    width: 300,
    height: 771,
    selected: false,
    dragging: false,
    data: {
      id: 'chatOpenAI_0',
      label: 'ChatOpenAI',
      version: 8.2,
      name: 'chatOpenAI',
      type: 'ChatOpenAI',
      baseClasses: ['ChatOpenAI', 'BaseChatModel', 'BaseLanguageModel', 'Runnable'],
      category: 'Chat Models',
      description: 'Wrapper around OpenAI large language models that use the Chat endpoint',
      inputParams: [],
      inputAnchors: [],
      inputs: {
        cache: '',
        modelName: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 2000,
        allowImageUploads: false,
        streaming: false
      },
      outputAnchors: [],
      outputs: {},
      selected: false
    }
  },
  {
    id: 'humanMessage_0',
    type: 'customNode',
    position: { x: 450.5125, y: 72.4059 },
    positionAbsolute: { x: 450.5125, y: 72.4059 },
    width: 300,
    height: 200,
    selected: false,
    dragging: false,
    data: {
      id: 'humanMessage_0',
      label: 'Human Message',
      version: 1,
      name: 'humanMessage',
      type: 'HumanMessage',
      baseClasses: ['HumanMessage', 'BaseMessage'],
      category: 'Messages',
      description: 'Human message input',
      inputParams: [],
      inputAnchors: [],
      inputs: {
        text: '{{chatInput}}'
      },
      outputAnchors: [],
      outputs: {},
      selected: false
    }
  },
  {
    id: 'promptTemplate_0',
    type: 'customNode',
    position: { x: 800.5125, y: 72.4059 },
    positionAbsolute: { x: 800.5125, y: 72.4059 },
    width: 300,
    height: 300,
    selected: false,
    dragging: false,
    data: {
      id: 'promptTemplate_0',
      label: 'Prompt Template',
      version: 1,
      name: 'promptTemplate',
      type: 'PromptTemplate',
      baseClasses: ['PromptTemplate', 'BasePromptTemplate'],
      category: 'Prompts',
      description: 'Schema to represent a prompt for an LLM',
      inputParams: [],
      inputAnchors: [],
      inputs: {
        template: 'Você é um assistente útil. Responda: {input}'
      },
      outputAnchors: [],
      outputs: {},
      selected: false
    }
  },
  {
    id: 'memory_0',
    type: 'customNode',
    position: { x: 1200.6757, y: 208.1858 },
    positionAbsolute: { x: 1200.6757, y: 208.1858 },
    width: 300,
    height: 400,
    selected: false,
    dragging: false,
    data: {
      id: 'memory_0',
      label: 'Buffer Memory',
      version: 1,
      name: 'bufferMemory',
      type: 'BufferMemory',
      baseClasses: ['BufferMemory', 'BaseChatMemory'],
      category: 'Memory',
      description: 'Buffer for storing conversation history',
      inputParams: [],
      inputAnchors: [],
      inputs: {
        memoryType: 'Buffer Memory',
        bufferSize: 10,
        returnMessages: true
      },
      outputAnchors: [],
      outputs: {},
      selected: false
    }
  }
];

const sampleEdges: FlowiseEdge[] = [
  {
    id: 'edge_0',
    source: 'humanMessage_0',
    target: 'promptTemplate_0',
    sourceHandle: 'humanMessage',
    targetHandle: 'promptTemplate',
    type: 'default'
  },
  {
    id: 'edge_1',
    source: 'promptTemplate_0',
    target: 'chatOpenAI_0',
    sourceHandle: 'promptTemplate',
    targetHandle: 'chatOpenAI',
    type: 'default'
  },
  {
    id: 'edge_2',
    source: 'chatOpenAI_0',
    target: 'memory_0',
    sourceHandle: 'chatOpenAI',
    targetHandle: 'memory',
    type: 'default'
  }
];

export default function WorkflowStudioPage() {
  const [nodes, setNodes] = useState<FlowiseNode[]>(sampleNodes);
  const [edges, setEdges] = useState<FlowiseEdge[]>(sampleEdges);
  const [workflowType, setWorkflowType] = useState<'CHATFLOW' | 'AGENTFLOW' | 'MULTIAGENT' | 'ASSISTANT'>('CHATFLOW');
  const [agentCapabilities, setAgentCapabilities] = useState<string[]>([
    'llm',
    'memory',
    'function_calling',
    'advanced_reasoning'
  ]);

  const handleNodesModified = (modifiedNodes: FlowiseNode[]) => {
    setNodes(modifiedNodes);
    console.log('🔧 Nós modificados:', modifiedNodes.length);
  };

  const handleModelSelected = (model: any, configuration: Record<string, any>) => {
    console.log('🤖 Modelo selecionado:', model.name, configuration);
    // Aqui você pode integrar com o modificador de nós para atualizar o modelo em um nó existente
  };

  const resetToSample = () => {
    setNodes(sampleNodes);
    setEdges(sampleEdges);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <Workflow className="h-8 w-8" />
              <span>Workflow Studio</span>
            </h1>
          </div>
          <p className="text-muted-foreground">
            Ambiente completo para criação, modificação e validação de workflows com suporte a modelos LLM
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={resetToSample}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Salvar Workflow
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Nós</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nodes.length}</div>
            <p className="text-xs text-muted-foreground">
              {nodes.filter(n => n.data.category === 'Chat Models').length} Chat Models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conexões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{edges.length}</div>
            <p className="text-xs text-muted-foreground">
              Workflow conectado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowType}</div>
            <p className="text-xs text-muted-foreground">
              Tipo de workflow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Capacidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentCapabilities.length}</div>
            <p className="text-xs text-muted-foreground">
              Habilidades do agente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Ativo</div>
            <p className="text-xs text-muted-foreground">
              Sistema operacional
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="modifier" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modifier" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Modificador de Nós</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Validação</span>
          </TabsTrigger>
          <TabsTrigger value="llm" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Modelos LLM</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Visão Geral</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modifier" className="space-y-6">
          <NodeModifierInterface
            nodes={nodes}
            edges={edges}
            onNodesModified={handleNodesModified}
            workflowType={workflowType}
            agentCapabilities={agentCapabilities}
          />
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <WorkflowValidationInterface
            nodes={nodes}
            edges={edges}
            onValidationComplete={(preview) => {
              console.log('✅ Validação concluída:', preview.validation.valid);
            }}
          />
        </TabsContent>

        <TabsContent value="llm" className="space-y-6">
          <LLMModelInterface
            onModelSelected={handleModelSelected}
            initialModelId="gpt-4o-mini"
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Recursos do Sistema</span>
                </CardTitle>
                <CardDescription>
                  Funcionalidades disponíveis no Workflow Studio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Modificador de Nós</div>
                      <div className="text-sm text-muted-foreground">
                        Modifique parâmetros de diferentes tipos de nós em tempo real
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Validação de Workflows</div>
                      <div className="text-sm text-muted-foreground">
                        Análise completa de estrutura, performance e custos
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="font-medium">Gestão de Modelos LLM</div>
                      <div className="text-sm text-muted-foreground">
                        Selecione e configure modelos de linguagem com otimização automática
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-orange-500" />
                    <div>
                      <div className="font-medium">Recomendações Inteligentes</div>
                      <div className="text-sm text-muted-foreground">
                        Sugestões baseadas em contexto e caso de uso
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Estatísticas do Workflow</span>
                </CardTitle>
                <CardDescription>
                  Métricas e informações sobre o workflow atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{nodes.length}</div>
                      <div className="text-sm text-muted-foreground">Nós Totais</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{edges.length}</div>
                      <div className="text-sm text-muted-foreground">Conexões</div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Distribuição de Categorias</h4>
                    <div className="space-y-2">
                      {Object.entries(
                        nodes.reduce((acc, node) => {
                          const category = node.data.category;
                          acc[category] = (acc[category] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([category, count]) => (
                        <div key={category} className="flex justify-between">
                          <span className="text-sm">{category}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Capacidades do Agente</h4>
                    <div className="flex flex-wrap gap-2">
                      {agentCapabilities.map((capability) => (
                        <Badge key={capability} variant="secondary">
                          {capability.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cpu className="h-5 w-5" />
                <span>Ações Rápidas</span>
              </CardTitle>
              <CardDescription>
                Ações comuns para manipulação de workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Plus className="h-6 w-6 mb-2" />
                  <span>Novo Workflow</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <RefreshCw className="h-6 w-6 mb-2" />
                  <span>Validar Tudo</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <Play className="h-6 w-6 mb-2" />
                  <span>Executar Teste</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}