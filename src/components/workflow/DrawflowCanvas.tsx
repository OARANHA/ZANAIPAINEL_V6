"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
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
  Download
} from 'lucide-react';

// Dynamically import Drawflow to avoid SSR issues
const Drawflow = dynamic(() => import('drawflow'), { ssr: false });

// Import Drawflow CSS
import 'drawflow/dist/drawflow.min.css';

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

interface DrawflowCanvasProps {
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

export default function DrawflowCanvas({
  workflow,
  onNodeClick,
  onEditNode,
  onSave,
  onPreview,
  className = ""
}: DrawflowCanvasProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const drawflowRef = useRef<any>(null);

  // Parse workflow data
  useEffect(() => {
    try {
      const flowData = JSON.parse(workflow.flowData);
      setNodes(flowData.nodes || []);
      setEdges(flowData.edges || []);
    } catch (error) {
      console.error('Error parsing workflow data:', error);
    }
  }, [workflow.flowData]);

  // Initialize Drawflow
  useEffect(() => {
    if (typeof window !== 'undefined' && Drawflow && !isInitialized && nodes.length > 0) {
      initializeDrawflow();
    }
  }, [Drawflow, isInitialized, nodes, edges]);

  const initializeDrawflow = async () => {
    if (!containerRef.current) return;

    try {
      // Import Drawflow dynamically
      const DrawflowModule = await import('drawflow');
      const DrawflowClass = DrawflowModule.default;
      
      // Create Drawflow instance
      drawflowRef.current = new DrawflowClass(containerRef.current, 'vue', false, false);
      
      // Start Drawflow
      drawflowRef.current.start();
      
      // Register custom node types
      registerNodeTypes();
      
      // Load existing workflow data
      loadWorkflowData();
      
      // Set up event listeners
      setupEventListeners();
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing Drawflow:', error);
      // Fallback to simple canvas if Drawflow fails
      setIsInitialized(true);
    }
  };

  const registerNodeTypes = () => {
    if (!drawflowRef.current) return;

    // For now, we'll use the default node types and customize them with CSS classes
    // This is simpler than registering custom node types
    console.log('Drawflow initialized with default node types');
  };

  const loadWorkflowData = () => {
    if (!drawflowRef.current) return;

    // Clear existing nodes
    drawflowRef.current.clear();
    
    // Add nodes to Drawflow using default node type
    nodes.forEach(node => {
      try {
        drawflowRef.current.addNode(
          'default', // Use default node type
          node.position.x,
          node.position.y,
          {},
          'default',
          {
            ...node.data,
            id: node.id,
            type: node.type,
            position: node.position
          },
          node.id
        );
      } catch (error) {
        console.error('Error adding node:', error);
      }
    });
    
    // Add connections to Drawflow
    edges.forEach(edge => {
      try {
        drawflowRef.current.addConnection(
          edge.source,
          edge.target,
          'output_1',
          'input_1'
        );
      } catch (error) {
        console.error('Error adding connection:', error);
      }
    });
  };

  const setupEventListeners = () => {
    if (!drawflowRef.current) return;

    // Node click event
    drawflowRef.current.on('nodeCreated', (nodeId: string) => {
      console.log('Node created:', nodeId);
    });

    // Node selected event
    drawflowRef.current.on('nodeSelected', (nodeId: string) => {
      console.log('Node selected:', nodeId);
    });

    // Connection created event
    drawflowRef.current.on('connectionCreated', (connection: any) => {
      console.log('Connection created:', connection);
    });

    // Connection removed event
    drawflowRef.current.on('connectionRemoved', (connection: any) => {
      console.log('Connection removed:', connection);
    });
  };

  // Drawflow control functions
  const zoomIn = () => {
    if (drawflowRef.current) {
      drawflowRef.current.zoom_in();
    }
  };

  const zoomOut = () => {
    if (drawflowRef.current) {
      drawflowRef.current.zoom_out();
    }
  };

  const zoomReset = () => {
    if (drawflowRef.current) {
      drawflowRef.current.zoom_reset();
    }
  };

  const exportData = () => {
    if (drawflowRef.current) {
      const data = drawflowRef.current.export();
      console.log('Exported Drawflow data:', data);
      // Here you could save the data or update the workflow
    }
  };

  // Get node color based on type
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

  // Get node icon based on type
  const getNodeIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      'Start': '▶',
      'Agent': '🤖',
      'Condition': '🔀',
      'LLM': '🧠',
      'Loop': '🔄',
      'Tool': '🔧',
      'Document': '📄',
      'Memory': '💾',
      'API': '🌐',
    };
    return icons[type] || '⚪';
  };

  return (
    <Card className={`w-full h-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{workflow.name}</CardTitle>
            <Badge variant="outline">{workflow.type}</Badge>
            <Badge variant="secondary">
              Complexidade: {workflow.complexityScore}/100
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomReset}
              title="Resetar zoom"
            >
              <Move className="w-4 h-4" />
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
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              title="Exportar dados"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (drawflowRef.current) {
                  drawflowRef.current.clear();
                  console.log('Canvas cleared');
                }
              }}
              title="Limpar canvas"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {nodes.length} nós • {edges.length} conexões
          </div>
          
          <div className="flex items-center gap-2">
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
        <div className="flex h-[600px]">
          {/* Sidebar with node types */}
          <div className="w-64 bg-gray-100 border-r p-4 overflow-y-auto">
            <h3 className="font-semibold text-sm mb-4">Node Types</h3>
            <div className="space-y-2">
              {['Start', 'Agent', 'Condition', 'LLM', 'Loop', 'Tool', 'Document', 'Memory', 'API'].map((nodeType) => (
                <div
                  key={nodeType}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('nodeType', nodeType);
                  }}
                  className="p-3 bg-white rounded-lg border cursor-move hover:shadow-md transition-shadow"
                  style={{ borderLeft: `4px solid ${getNodeColor(nodeType)}` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getNodeIcon(nodeType)}</span>
                    <div>
                      <div className="font-medium text-sm">{nodeType}</div>
                      <div className="text-xs text-gray-500">Drag to canvas</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Main canvas area */}
          <div
            ref={containerRef}
            className="flex-1 relative bg-gray-50"
            style={{
              background: '#f9fafb',
              backgroundImage: `
                linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const nodeType = e.dataTransfer.getData('nodeType');
              if (nodeType && drawflowRef.current) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Add new node to Drawflow
                const newNodeId = `node_${Date.now()}`;
                drawflowRef.current.addNode(
                  'default',
                  x,
                  y,
                  {},
                  'default',
                  {
                    label: nodeType,
                    type: nodeType,
                    category: 'General'
                  },
                  newNodeId
                );
                
                console.log(`Added ${nodeType} node at (${x}, ${y})`);
              }
            }}
          >
            {!isInitialized && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando editor Drawflow...</p>
                </div>
              </div>
            )}
            
            {/* Instructions overlay */}
            <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded-lg pointer-events-none">
              <div>🖱️ Arraste nós da sidebar • Conecte nós clicando e arrastando</div>
              <div>📋 Use o scroll para zoom • Clique nos nós para selecionar</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}