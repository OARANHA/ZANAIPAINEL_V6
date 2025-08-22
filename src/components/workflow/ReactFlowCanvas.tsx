"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  MarkerType,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Move, 
  Settings, 
  Save,
  Play,
  Eye,
  Edit,
  RefreshCw,
  Bot,
  Cpu,
  GitBranch,
  Database,
  MemoryStick,
  Globe,
  AlertTriangle,
  CheckCircle
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

// Custom Node Component
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
      'Start': <CheckCircle className="w-4 h-4" />,
      'Agent': <Bot className="w-4 h-4" />,
      'Condition': <GitBranch className="w-4 h-4" />,
      'LLM': <Cpu className="w-4 h-4" />,
      'Loop': <RefreshCw className="w-4 h-4" />,
      'Tool': <Settings className="w-4 h-4" />,
      'Document': <Database className="w-4 h-4" />,
      'Memory': <MemoryStick className="w-4 h-4" />,
      'API': <Globe className="w-4 h-4" />,
    };
    return icons[type] || <AlertTriangle className="w-4 h-4" />;
  };

  const nodeColor = getNodeColor(data.type);
  
  return (
    <div 
      className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[150px] transition-all duration-200 ${
        selected ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-xl'
      }`}
      style={{ borderColor: nodeColor }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="p-1 rounded"
          style={{ backgroundColor: nodeColor }}
        >
          <div className="text-white">
            {getNodeIcon(data.type)}
          </div>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm text-gray-900 line-clamp-2">
            {data.label}
          </div>
          <div className="text-xs text-gray-500">
            {data.type}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
        <Badge variant="secondary" className="text-xs">
          {data.category}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs px-2"
          onClick={(e) => {
            e.stopPropagation();
            data.onEdit?.();
          }}
        >
          <Edit className="w-3 h-3 mr-1" />
          Editar
        </Button>
      </div>
      
      {/* Connection handles */}
      <div 
        className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"
        style={{ display: data.type === 'Start' ? 'none' : 'block' }}
      />
      <div 
        className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"
        style={{ display: data.type === 'Generate Final Answer' ? 'none' : 'block' }}
      />
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
      }));

      // Convert edges to ReactFlow format
      const reactFlowEdges: Edge[] = workflowEdges.map((edge: WorkflowEdge, index: number) => ({
        id: `edge-${index}`,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: true,
        style: { 
          stroke: '#94a3b8', 
          strokeWidth: 2 
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#64748b',
        },
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

  // Handle connection
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `edge-${Date.now()}`,
        type: 'smoothstep',
        animated: true,
        style: { 
          stroke: '#94a3b8', 
          strokeWidth: 2 
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#64748b',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: `${type} Node`,
          type: type,
          category: 'General',
          onEdit: () => {},
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Fit view to screen
  const fitView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView();
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
    <Card className={`w-full h-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              {workflow.name}
            </CardTitle>
            <Badge variant="outline">{workflow.type}</Badge>
            <Badge variant="secondary">
              Complexidade: {workflow.complexityScore}/100
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {workflow.nodeCount} nós • {workflow.edgeCount} conexões
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fitView}
              title="Ajustar à tela"
            >
              <Maximize className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              title="Diminuir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            {onPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPreview}
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
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div 
          ref={reactFlowWrapper}
          className="w-full h-[600px] border-t"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClickHandler}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap 
              nodeStrokeColor={(n) => {
                if (n.style?.backgroundColor) return n.style.backgroundColor as string;
                return '#eee';
              }}
              nodeColor={(n) => {
                if (n.style?.backgroundColor) return n.style.backgroundColor as string;
                return '#fff';
              }}
              nodeBorderRadius={2}
            />
            <Background 
              color="#aaa" 
              gap={16} 
              variant="dots" 
            />
          </ReactFlow>
        </div>
        
        {/* Instructions overlay */}
        <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded-lg">
          <div>🖱️ Arraste para pan • Scroll para zoom • Clique nos nós para selecionar</div>
          <div>✏️ Clique em "Editar" para configurar o conteúdo de cada nó</div>
        </div>
      </CardContent>
    </Card>
  );
}