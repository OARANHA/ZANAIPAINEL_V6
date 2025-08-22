"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Edge,
  Node,
  NodeTypes,
  MarkerType,
  Position,
  Connection,
  addEdge,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Save,
  Play,
  Eye,
  Edit,
  Settings,
  Bot,
  Cpu,
  GitBranch,
  Database,
  MemoryStick,
  Globe,
  AlertTriangle,
  CheckCircle,
  RotateCcw
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    type: string;
    category: string;
    [key: string]: any;
  };
}

interface WorkflowEdge {
  source: string;
  target: string;
}

interface ReactFlowCanvasProps {
  workflow: {
    id: string;
    name: string;
    flowData: string;
    type: string;
    complexityScore: number;
    nodeCount: number;
    edgeCount: number;
  };
  onNodeClick?: (node: WorkflowNode) => void;
  onEditNode?: (node: WorkflowNode) => void;
  onSave?: () => void;
  onPreview?: () => void;
  className?: string;
}

// Custom Node Component - Enhanced with better connections and improved icons
const CustomNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const getNodeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'Start': '#10b981',      // green
      'Agent': '#06b6d4',     // cyan
      'Condition': '#f59e0b', // amber
      'LLM': '#8b5cf6',       // violet
      'Loop': '#ef4444',      // red
      'Tool': '#f97316',      // orange
      'Document': '#84cc16',  // lime
      'Memory': '#ec4899',    // pink
      'API': '#6366f1',       // indigo
    };
    return colors[type] || '#6b7280'; // gray
  };

  const getNodeIcon = (type: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'Start': <CheckCircle className="w-5 h-5" />,
      'Agent': <Bot className="w-5 h-5" />,
      'Condition': <GitBranch className="w-5 h-5" />,
      'LLM': <Cpu className="w-5 h-5" />,
      'Loop': <AlertTriangle className="w-5 h-5" />,
      'Tool': <Database className="w-5 h-5" />,
      'Document': <Database className="w-5 h-5" />,
      'Memory': <MemoryStick className="w-5 h-5" />,
      'API': <Globe className="w-5 h-5" />,
    };
    return icons[type] || <AlertTriangle className="w-5 h-5" />;
  };

  const nodeColor = getNodeColor(data.type);
  
  return (
    <div 
      className={`px-4 py-3 shadow-lg rounded-xl border-2 bg-white min-w-[160px] transition-all duration-300 hover:shadow-xl ${
        selected ? 'ring-4 ring-blue-400 shadow-xl scale-105' : 'hover:shadow-lg hover:scale-102'
      }`}
      style={{ 
        borderColor: nodeColor,
        boxShadow: selected ? `0 0 0 4px ${nodeColor}20` : undefined
      }}
    >
      {/* Enhanced connection handles */}
      <div 
        className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-200 hover:scale-125 cursor-crosshair"
        style={{ 
          backgroundColor: nodeColor,
          display: data.type === 'Start' ? 'none' : 'block'
        }}
        title="Conexão de entrada"
      />
      <div 
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-200 hover:scale-125 cursor-crosshair"
        style={{ 
          backgroundColor: nodeColor,
          display: data.type === 'Generate Final Answer' ? 'none' : 'block'
        }}
        title="Conexão de saída"
      />
      
      {/* Node content */}
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="p-2 rounded-lg shadow-sm transition-all duration-200 hover:scale-110"
          style={{ backgroundColor: nodeColor }}
        >
          <div className="text-white">
            {getNodeIcon(data.type)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight">
            {data.label}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.type}
          </div>
        </div>
      </div>
      
      {/* Status and actions */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
        <Badge 
          variant="secondary" 
          className="text-xs font-medium"
          style={{ 
            backgroundColor: `${nodeColor}20`,
            color: nodeColor,
            borderColor: `${nodeColor}40`
          }}
        >
          {data.category}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-3 hover:bg-gray-100 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            data.onEdit?.();
          }}
        >
          <Edit className="w-3 h-3 mr-1" />
          Editar
        </Button>
      </div>
    </div>
  );
};

// Node types configuration
const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export default function ReactFlowCanvas({
  workflow,
  onNodeClick,
  onEditNode,
  onSave,
  onPreview,
  className = ""
}: ReactFlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Parse workflow data and convert to ReactFlow format
  useEffect(() => {
    try {
      const flowData = JSON.parse(workflow.flowData);
      const workflowNodes = flowData.nodes || [];
      const workflowEdges = flowData.edges || [];

      // Convert nodes to ReactFlow format
      const reactFlowNodes: Node[] = workflowNodes.map((node: WorkflowNode) => ({
        id: node.id,
        type: 'custom',
        position: node.position,
        data: {
          ...node.data,
          onEdit: () => onEditNode?.(node),
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        // Habilitar arrastar nós
        draggable: true,
      }));

      // Convert edges to ReactFlow format - White connection lines
      const reactFlowEdges: Edge[] = workflowEdges.map((edge: WorkflowEdge, index: number) => ({
        id: `edge-${index}`,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: false,
        style: { 
          stroke: '#ffffff', 
          strokeWidth: 2,
          filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#ffffff',
          width: 15,
          height: 15,
        },
        // Habilitar edição de arestas
        selectable: true,
        updatable: true,
        deletable: true,
        className: 'transition-all duration-200',
      }));

      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
    } catch (error) {
      console.error('Error parsing workflow data:', error);
    }
  }, [workflow.flowData, onEditNode]);

  // Handle node click
  const onNodeClickHandler = useCallback((event: React.MouseEvent, node: Node) => {
    const workflowNode: WorkflowNode = {
      id: node.id,
      type: node.data.type,
      position: node.position,
      data: node.data,
    };
    setSelectedNode(workflowNode);
    onNodeClick?.(workflowNode);
  }, [onNodeClick]);

  // Handle connection creation
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `edge-${edges.length}`,
        type: 'smoothstep',
        animated: false,
        style: { 
          stroke: '#ffffff', 
          strokeWidth: 2,
          filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#ffffff',
          width: 15,
          height: 15,
        },
        selectable: true,
        updatable: true,
        deletable: true,
        className: 'transition-all duration-200',
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [edges.length]
  );

  // Initialize ReactFlow instance
  const onInit = useCallback((instance: any) => {
    setReactFlowInstance(instance);
    // Fit view to show all nodes
    setTimeout(() => {
      instance.fitView();
    }, 100);
  }, []);

  // Fit view to screen
  const fitView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView();
    }
  };

  // Reset view
  const resetView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.setTransform({ x: 0, y: 0, zoom: 1 });
    }
  };

  // Zoom controls
  const zoomIn = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  };

  const zoomOut = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  };

  return (
    <Card className={`w-full h-full bg-gray-900 border-gray-800 ${className}`}>
      <CardHeader className="pb-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Settings className="w-5 h-5 text-blue-400" />
              {workflow.name}
            </CardTitle>
            <Badge variant="outline" className="border-gray-600 text-gray-300">{workflow.type}</Badge>
            <Badge variant="secondary" className="bg-gray-800 text-gray-300">
              Complexidade: {workflow.complexityScore}/100
            </Badge>
            <Badge variant="outline" className="bg-green-900/50 text-green-300 border-green-700">
              {workflow.nodeCount} nós • {workflow.edgeCount} conexões
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
              title="Resetar visualização"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fitView}
              title="Ajustar à tela"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <Maximize className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              title="Diminuir zoom"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              title="Aumentar zoom"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            {onPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPreview}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}
            {onSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 bg-black">
        <div 
          ref={reactFlowWrapper}
          className="w-full h-[600px] border-t border-gray-800 relative"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClickHandler}
            onConnect={onConnect}
            onInit={onInit}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            // Habilitar todas as interações
            nodesDraggable={true}
            nodesConnectable={true}
            edgesUpdatable={true}
            elementsSelectable={true}
            connectionLineType="smoothstep"
            connectionLineStyle={{ 
              stroke: '#ffffff', 
              strokeWidth: 2,
              strokeDasharray: '5,5'
            }}
            attributionPosition="bottom-left"
          >
            <Controls 
              className="bg-gray-800 border-gray-700 text-white"
              showInteractive={false}
            />
            
            {/* Fundo preto com pontinhos */}
            <Background 
              color="#4a5568" 
              gap={20} 
              variant="dots"
              size={1}
            />
          </ReactFlow>
        </div>
        
        {/* Instructions overlay */}
        <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs px-4 py-3 rounded-lg backdrop-blur-sm border border-gray-700">
          <div className="font-semibold mb-1">Controles:</div>
          <div>🖱️ Scroll para zoom • Arraste para pan</div>
          <div>🔗 Arraste entre nós para conectar</div>
          <div>✏️ Clique em "Editar" para configurar o conteúdo</div>
          <div>📦 Arraste as caixas para reposicionar</div>
        </div>
      </CardContent>
    </Card>
  );
}