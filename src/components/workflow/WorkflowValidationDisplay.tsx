"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  RefreshCw,
  Lightbulb,
  Shield,
  Zap
} from 'lucide-react';
import { ValidationResult, ValidationError } from '@/lib/workflow-validator';

interface WorkflowValidationDisplayProps {
  validation: ValidationResult | null;
  isValidating?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export default function WorkflowValidationDisplay({
  validation,
  isValidating = false,
  onRefresh,
  className = ""
}: WorkflowValidationDisplayProps) {
  if (!validation) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Validação do Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Validar" para verificar o workflow</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getValidationColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getValidationIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 70) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const renderValidationItem = (item: ValidationError, index: number) => {
    const icon = item.type === 'error' ? (
      <XCircle className="w-4 h-4 text-red-600" />
    ) : item.type === 'warning' ? (
      <AlertTriangle className="w-4 h-4 text-yellow-600" />
    ) : (
      <Info className="w-4 h-4 text-blue-600" />
    );

    return (
      <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
        {icon}
        <div className="flex-1">
          <p className="text-sm font-medium">{item.message}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={`text-xs ${getSeverityColor(item.severity)}`}>
              {item.severity === 'high' ? 'Alta' : item.severity === 'medium' ? 'Média' : 'Baixa'}
            </Badge>
            {item.nodeId && (
              <Badge variant="secondary" className="text-xs">
                Nó: {item.nodeId}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Validação do Workflow
          </CardTitle>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isValidating}
            >
              {isValidating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Validar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Validation Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Pontuação de Validação</span>
            <div className="flex items-center gap-2">
              {getValidationIcon(validation.score)}
              <span className={`text-lg font-bold ${getValidationColor(validation.score)}`}>
                {validation.score}/100
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                validation.score >= 90 ? 'bg-green-500' :
                validation.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${validation.score}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        {/* Overall Status */}
        <Alert className={`mb-6 ${validation.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          {validation.isValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>
            {validation.isValid 
              ? 'Workflow está válido e pronto para execução!'
              : 'Workflow contém erros que precisam ser corrigidos.'
            }
          </AlertDescription>
        </Alert>

        {/* Validation Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{validation.errors.length}</div>
            <div className="text-sm text-muted-foreground">Erros</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{validation.warnings.length}</div>
            <div className="text-sm text-muted-foreground">Avisos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{validation.info.length}</div>
            <div className="text-sm text-muted-foreground">Informações</div>
          </div>
        </div>

        {/* Validation Details */}
        <div className="space-y-4">
          {validation.errors.length > 0 && (
            <div>
              <h4 className="font-medium text-red-600 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Erros ({validation.errors.length})
              </h4>
              <div className="space-y-2">
                {validation.errors.map(renderValidationItem)}
              </div>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-600 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Avisos ({validation.warnings.length})
              </h4>
              <div className="space-y-2">
                {validation.warnings.map(renderValidationItem)}
              </div>
            </div>
          )}

          {validation.info.length > 0 && (
            <div>
              <h4 className="font-medium text-blue-600 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Informações ({validation.info.length})
              </h4>
              <div className="space-y-2">
                {validation.info.map(renderValidationItem)}
              </div>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {validation.score < 90 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Recomendações
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {validation.errors.length > 0 && (
                <li>• Corrija todos os erros marcados em vermelho</li>
              )}
              {validation.warnings.length > 0 && (
                <li>• Revise os avisos para melhorar a qualidade do workflow</li>
              )}
              {validation.score < 70 && (
                <li>• Considere simplificar o workflow para melhor performance</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}