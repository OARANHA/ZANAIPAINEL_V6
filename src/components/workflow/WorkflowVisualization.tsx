'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Settings, 
  Play, 
  Maximize2,
  Info,
  GitBranch,
  Database,
  Cpu,
  MessageSquare,
  FileText,
  Search
} from 'lucide-react';

interface FlowiseNode {
  path: string;
  label: string;
  desc: string;
  categoria: string;
  inputs: string | string[];
  outputs: string | string[];
}

interface WorkflowConfig {
  workflowName: string;
  workflowDescription: string;
  autoConnect: boolean;
  optimizeLayout: boolean;
  includeMemory: boolean;
  includeTools: boolean;
}

interface WorkflowVisualizationProps {
  nodes: FlowiseNode[];
  config: WorkflowConfig;
  complexity: 'simple' | 'medium' | 'complex';
  onNodeClick?: (node: FlowiseNode) => void;
  onEditWorkflow?: () => void;
  className?: string;
}

export function WorkflowVisualization({
  nodes,
  config,
  complexity,
  onNodeClick,
  onEditWorkflow,
  className = ''
}: WorkflowVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<FlowiseNode | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const getNodeIcon = (categoria: string) => {
    switch (categoria) {
      case 'LLM': return <Cpu className="h-5 w-5" />;
      case 'Memory': return <Database className="h-5 w-5" />;
      case 'Tools': return <Settings className="h-5 w-5" />;
      case 'Document Loaders': return <FileText className="h-5 w-5" />;
      case 'Text Splitters': return <FileText className="h-5 w-5" />;
      case 'Embeddings': return <Search className="h-5 w-5" />;
      case 'Vector Stores': return <Database className="h-5 w-5" />;
      case 'Retrievers': return <Search className="h-5 w-5" />;
      case 'Prompt Templates': return <MessageSquare className="h-5 w-5" />;
      default: return <GitBranch className="h-5 w-5" />;
    }
  };

  const getNodeColor = (categoria: string) => {
    switch (categoria) {
      case 'LLM': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'Memory': return 'bg-green-100 border-green-300 text-green-800';
      case 'Tools': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'Document Loaders': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'Text Splitters': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'Embeddings': return 'bg-pink-100 border-pink-300 text-pink-800';
      case 'Vector Stores': return 'bg-indigo-100 border-indigo-300 text-indigo-800';
      case 'Retrievers': return 'bg-teal-100 border-teal-300 text-teal-800';
      case 'Prompt Templates': return 'bg-cyan-100 border-cyan-300 text-cyan-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const handleNodeClick = (node: FlowiseNode) => {
    setSelectedNode(node);
    onNodeClick?.(node);
  };

  return (
    <Card className={`${className} ${isExpanded ? 'fixed inset-4 z-50 m-0' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Visualização do Workflow
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={complexity === 'simple' ? 'default' : complexity === 'medium' ? 'secondary' : 'destructive'}
            >
              {complexity === 'simple' ? 'Simples' : complexity === 'medium' ? 'Médio' : 'Complexo'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            {onEditWorkflow && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditWorkflow}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {config.workflowName}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Descrição do Workflow */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            {config.workflowDescription}
          </p>
        </div>

        {/* Visualização do Fluxo */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Fluxo do Workflow</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              {nodes.length} nodes
            </div>
          </div>

          <div className="relative">
            {/* Linha de conexão */}
            <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-border"></div>
            
            {/* Nodes */}
            <div className="space-y-4">
              {/* Node Inicial */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                  1
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Início</div>
                  <div className="text-xs text-muted-foreground">Ponto de entrada</div>
                </div>
              </div>

              {/* Nodes Configurados */}
              {nodes.map((node, index) => (
                <div key={node.path} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground text-sm font-medium">
                    {index + 2}
                  </div>
                  <div 
                    className={`flex-1 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${getNodeColor(node.categoria)}`}
                    onClick={() => handleNodeClick(node)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getNodeIcon(node.categoria)}
                      <div className="text-sm font-medium">{node.label}</div>
                      <Badge variant="outline" className="text-xs">
                        {node.categoria}
                      </Badge>
                    </div>
                    <div className="text-xs opacity-75">{node.desc}</div>
                    
                    {/* Inputs e Outputs */}
                    <div className="flex gap-2 mt-2">
                      {node.inputs && node.inputs.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium">Inputs:</span> {
                            Array.isArray(node.inputs) 
                              ? node.inputs.join(', ') 
                              : node.inputs
                          }
                        </div>
                      )}
                      {node.outputs && node.outputs.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium">Outputs:</span> {
                            Array.isArray(node.outputs) 
                              ? node.outputs.join(', ') 
                              : node.outputs
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Node Final */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                  {nodes.length + 2}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Fim</div>
                  <div className="text-xs text-muted-foreground">Ponto de saída</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detalhes do Node Selecionado */}
        {selectedNode && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium flex items-center gap-2">
                  {getNodeIcon(selectedNode.categoria)}
                  {selectedNode.label}
                </h4>
                <Badge variant="outline">{selectedNode.categoria}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {selectedNode.desc}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium mb-1">Inputs</div>
                  <div className="text-muted-foreground">
                    {selectedNode.inputs.length > 0 ? selectedNode.inputs.join(', ') : 'Nenhum'}
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-1">Outputs</div>
                  <div className="text-muted-foreground">
                    {selectedNode.outputs.length > 0 ? selectedNode.outputs.join(', ') : 'Nenhum'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEditWorkflow}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Editar Configuração
          </Button>
          <Button 
            size="sm" 
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Executar Workflow
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}