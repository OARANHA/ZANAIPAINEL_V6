"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Save, 
  X, 
  Play, 
  Settings, 
  FileText, 
  Brain, 
  MessageSquare,
  Database,
  Zap,
  TestTube,
  CheckCircle,
  AlertCircle,
  RefreshCw
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

interface NodeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: WorkflowNode | null;
  onSave: (nodeId: string, updates: any) => void;
  onTest?: (nodeId: string) => void;
}

interface ValidationRule {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'array';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export default function NodeEditorDialog({
  open,
  onOpenChange,
  node,
  onSave,
  onTest
}: NodeEditorDialogProps) {
  const [formData, setFormData] = useState<any>({});
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Validation rules for different node types
  const validationRules: {[key: string]: ValidationRule[]} = {
    'Agent': [
      { field: 'label', required: true, type: 'string', minLength: 1, maxLength: 50 },
      { field: 'agentModel', required: true, type: 'string' },
      { field: 'temperature', required: true, type: 'number', min: 0, max: 2 }
    ],
    'LLM': [
      { field: 'label', required: true, type: 'string', minLength: 1, maxLength: 50 },
      { field: 'modelName', required: true, type: 'string' }
    ],
    'Condition': [
      { field: 'label', required: true, type: 'string', minLength: 1, maxLength: 50 },
      { field: 'conditions', required: true, type: 'array' }
    ],
    'Start': [
      { field: 'label', required: true, type: 'string', minLength: 1, maxLength: 50 }
    ]
  };

  useEffect(() => {
    if (node) {
      setFormData(node.data);
      setValidationErrors({});
      setTestResult(null);
      setActiveTab('basic');
    }
  }, [node]);

  const validateField = (field: string, value: any): string | null => {
    const rules = validationRules[node?.data.type || ''] || [];
    const rule = rules.find(r => r.field === field);
    
    if (!rule) return null;
    
    if (rule.required && (value === undefined || value === null || value === '')) {
      return 'Este campo é obrigatório';
    }
    
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `Mínimo de ${rule.minLength} caracteres`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Máximo de ${rule.maxLength} caracteres`;
      }
    }
    
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `Valor mínimo: ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `Valor máximo: ${rule.max}`;
      }
    }
    
    return null;
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    const rules = validationRules[node?.data.type || ''] || [];
    
    rules.forEach(rule => {
      const error = validateField(rule.field, formData[rule.field]);
      if (error) {
        errors[rule.field] = error;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = () => {
    if (!node || !validateForm()) return;
    
    onSave(node.id, formData);
    onOpenChange(false);
  };

  const handleTest = async () => {
    if (!node || !validateForm()) return;
    
    setIsTesting(true);
    try {
      // Simulate test - in real implementation, this would call an API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTestResult({
        success: true,
        message: 'Teste executado com sucesso!',
        details: {
          executionTime: '1.2s',
          memoryUsage: '45MB',
          output: 'Configuração validada e funcionando corretamente.'
        }
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Erro no teste',
        details: {
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getNodeConfigFields = () => {
    if (!node) return [];
    
    switch (node.data.type) {
      case 'Agent':
        return [
          {
            key: 'agentModel',
            label: 'Modelo',
            type: 'select',
            options: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'claude-3', 'claude-3-haiku'],
            required: true
          },
          {
            key: 'temperature',
            label: 'Temperatura',
            type: 'number',
            min: 0,
            max: 2,
            step: 0.1,
            required: true
          },
          {
            key: 'maxTokens',
            label: 'Tokens Máximos',
            type: 'number',
            min: 1,
            max: 8000
          },
          {
            key: 'systemPrompt',
            label: 'System Prompt',
            type: 'textarea',
            rows: 6,
            placeholder: 'Defina o comportamento do agente...'
          },
          {
            key: 'enableMemory',
            label: 'Habilitar Memória',
            type: 'boolean'
          }
        ];
      
      case 'LLM':
        return [
          {
            key: 'modelName',
            label: 'Modelo',
            type: 'select',
            options: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'claude-3', 'claude-3-haiku'],
            required: true
          },
          {
            key: 'prompt',
            label: 'Prompt',
            type: 'textarea',
            rows: 6,
            required: true
          }
        ];
      
      case 'Condition':
        return [
          {
            key: 'conditions',
            label: 'Condições',
            type: 'array',
            arrayFields: [
              { key: 'type', label: 'Tipo', type: 'select', options: ['string', 'number', 'boolean'] },
              { key: 'value1', label: 'Valor 1', type: 'string' },
              { key: 'operation', label: 'Operação', type: 'select', options: ['equal', 'notEqual', 'contains', 'greater'] },
              { key: 'value2', label: 'Valor 2', type: 'string' }
            ]
          }
        ];
      
      default:
        return [
          {
            key: 'label',
            label: 'Nome',
            type: 'string',
            required: true
          }
        ];
    }
  };

  const renderFormField = (field: any) => {
    const value = formData[field.key] || '';
    const error = validationErrors[field.key];
    
    switch (field.type) {
      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key} className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
            </Label>
            <Select
              value={value}
              onValueChange={(v) => handleInputChange(field.key, v)}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
      
      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key} className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
            </Label>
            <Textarea
              id={field.key}
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
      
      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key} className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
            </Label>
            <Input
              id={field.key}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(field.key, parseFloat(e.target.value))}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={value}
              onCheckedChange={(checked) => handleInputChange(field.key, checked)}
            />
            <Label htmlFor={field.key}>{field.label}</Label>
          </div>
        );
      
      case 'array':
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
            </Label>
            <div className="border rounded-lg p-3 bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">
                Configuração de array - implementação futura
              </p>
              <Button variant="outline" size="sm">
                Adicionar Item
              </Button>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key} className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
            </Label>
            <Input
              id={field.key}
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
    }
  };

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Editar Nó: {node.data.label}
          </DialogTitle>
          <DialogDescription>
            Configurando nó do tipo <Badge variant="outline">{node.data.type}</Badge>
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Avançado
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Testar
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Info
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getNodeConfigFields().map((field) => (
                <div key={field.key}>
                  {renderFormField(field)}
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Configurações Avançadas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timeout (segundos)</Label>
                  <Input type="number" placeholder="30" />
                </div>
                <div className="space-y-2">
                  <Label>Retries</Label>
                  <Input type="number" placeholder="3" />
                </div>
                <div className="space-y-2">
                  <Label>Cache Duration</Label>
                  <Input type="number" placeholder="300" />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Normal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="test" className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Testar Configuração</h4>
              
              <div className="space-y-4">
                <Button
                  onClick={handleTest}
                  disabled={isTesting}
                  className="flex items-center gap-2"
                >
                  {isTesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isTesting ? 'Testando...' : 'Executar Teste'}
                </Button>
                
                {testResult && (
                  <div className={`p-4 rounded-lg border ${
                    testResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {testResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.message}
                      </span>
                    </div>
                    
                    {testResult.details && (
                      <div className="text-sm space-y-1">
                        {Object.entries(testResult.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="info" className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Informações do Nó</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ID:</span>
                  <p className="text-gray-600 font-mono text-xs">{node.id}</p>
                </div>
                <div>
                  <span className="font-medium">Tipo:</span>
                  <p className="text-gray-600">{node.data.type}</p>
                </div>
                <div>
                  <span className="font-medium">Categoria:</span>
                  <p className="text-gray-600">{node.data.category}</p>
                </div>
                <div>
                  <span className="font-medium">Posição:</span>
                  <p className="text-gray-600">
                    ({node.position.x}, {node.position.y})
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Descrição do Tipo</h5>
                <p className="text-sm text-gray-600">
                  {getNodeDescription(node.data.type)}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={Object.keys(validationErrors).length > 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getNodeDescription(type: string): string {
  const descriptions: {[key: string]: string} = {
    'Agent': 'Agente inteligente que pode usar ferramentas e tomar decisões',
    'LLM': 'Modelo de linguagem para processamento de texto',
    'Condition': 'Nó condicional que direciona o fluxo baseado em regras',
    'Start': 'Ponto de entrada do workflow',
    'Loop': 'Estrutura de repetição para executar ações múltiplas vezes',
    'Tool': 'Ferramenta externa para executar tarefas específicas',
    'Document': 'Gerenciamento de documentos e conhecimento',
    'Memory': 'Sistema de memória para manter contexto',
    'API': 'Integração com APIs externas'
  };
  return descriptions[type] || 'Nó do workflow';
}