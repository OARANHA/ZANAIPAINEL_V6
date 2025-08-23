import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

interface StudioWorkflowRequest {
  action: string;
  data?: any;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as StudioWorkflowRequest;
    const { action, data } = body;

    console.log('🔍 Learning Workflows API:', { action, data });

    switch (action) {
      case 'get_sent_workflows':
        return await handleGetSentWorkflows(data);
      
      case 'deep_analysis':
        return await handleDeepAnalysis(data);
      
      case 'generate_optimizations':
        return await handleGenerateOptimizations(data);
      
      default:
        return NextResponse.json(
          { success: false, error: 'Ação não suportada' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erro na API de learning workflows:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function handleGetSentWorkflows(data: any) {
  try {
    const { source } = data || {};
    
    // Buscar workflows do flowise_workflows que foram enviados para learning
    const workflows = await db.flowiseWorkflow.findMany({
      where: {
        // Filtrar por workflows que têm configuração indicando envio para learning
        OR: [
          {
            category: {
              contains: 'learning'
            }
          },
          {
            description: {
              contains: 'Imported from learning'
            }
          },
          {
            // Workflows com complexidade alta que são candidatos para análise
            complexityScore: {
              gte: 5
            }
          }
        ]
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 50
    });

    console.log(`📋 Encontrados ${workflows.length} workflows para análise`);

    // Formatar workflows para o formato esperado
    const formattedWorkflows = workflows.map(workflow => ({
      id: workflow.id,
      flowiseId: workflow.flowiseId,
      name: workflow.name,
      description: workflow.description,
      type: workflow.type,
      category: workflow.category,
      complexityScore: workflow.complexityScore,
      nodeCount: workflow.nodeCount,
      edgeCount: workflow.edgeCount,
      maxDepth: workflow.maxDepth,
      flowData: workflow.flowData,
      deployed: workflow.deployed,
      isPublic: workflow.isPublic,
      capabilities: workflow.capabilities,
      nodes: workflow.nodes,
      connections: workflow.connections,
      lastSyncAt: workflow.lastSyncAt,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      sentToLearning: true,
      analysisStatus: 'pending',
      analysisResult: null
    }));

    return NextResponse.json({
      success: true,
      workflows: formattedWorkflows,
      total: formattedWorkflows.length
    });

  } catch (error) {
    console.error('Erro ao buscar workflows enviados:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar workflows' },
      { status: 500 }
    );
  }
}

async function handleDeepAnalysis(data: any) {
  try {
    const { workflowId, flowData, includePerformance, includeSecurity, includeOptimization } = data;
    
    if (!workflowId || !flowData) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos para análise' },
        { status: 400 }
      );
    }

    // Simular análise detalhada
    const insights = [];
    const parsedFlowData = JSON.parse(flowData);
    
    // Análise de performance
    if (includePerformance) {
      const nodeCount = parsedFlowData.nodes?.length || 0;
      const edgeCount = parsedFlowData.edges?.length || 0;
      
      if (nodeCount > 20) {
        insights.push({
          type: 'performance',
          severity: 'warning',
          message: 'Workflow com muitos nós pode ter performance impactada',
          suggestion: 'Considere dividir em sub-workflows'
        });
      }
      
      if (edgeCount > nodeCount * 2) {
        insights.push({
          type: 'performance',
          severity: 'info',
          message: 'Alta conectividade detectada',
          suggestion: 'Verifique se todas as conexões são necessárias'
        });
      }
    }

    // Análise de segurança
    if (includeSecurity) {
      const hasExternalAPIs = parsedFlowData.nodes?.some((node: any) => 
        node.data?.category === 'documentloaders' || 
        node.data?.category === 'tools'
      );
      
      if (hasExternalAPIs) {
        insights.push({
          type: 'security',
          severity: 'warning',
          message: 'Workflow utiliza APIs externas',
          suggestion: 'Implemente validação de entrada e tratamento de erros'
        });
      }
    }

    // Análise de otimização
    if (includeOptimization) {
      const hasLLMNodes = parsedFlowData.nodes?.some((node: any) => 
        node.data?.category === 'llm'
      );
      
      if (hasLLMNodes) {
        insights.push({
          type: 'optimization',
          severity: 'info',
          message: 'Workflow contém nós LLM',
          suggestion: 'Considere usar cache para respostas similares'
        });
      }
    }

    // Atualizar status de análise no workflow
    await db.flowiseWorkflow.update({
      where: { id: workflowId },
      data: {
        category: 'analyzed',
        // Em um cenário real, salvaríamos os insights em um campo separado
      }
    });

    return NextResponse.json({
      success: true,
      insights,
      analysisSummary: {
        totalInsights: insights.length,
        performanceIssues: insights.filter(i => i.type === 'performance').length,
        securityIssues: insights.filter(i => i.type === 'security').length,
        optimizationOpportunities: insights.filter(i => i.type === 'optimization').length
      }
    });

  } catch (error) {
    console.error('Erro na análise detalhada:', error);
    return NextResponse.json(
      { success: false, error: 'Erro na análise detalhada' },
      { status: 500 }
    );
  }
}

async function handleGenerateOptimizations(data: any) {
  try {
    const { workflowId, flowData, currentComplexity } = data;
    
    if (!workflowId || !flowData) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos para otimização' },
        { status: 400 }
      );
    }

    const suggestions = [];
    const parsedFlowData = JSON.parse(flowData);
    const nodeCount = parsedFlowData.nodes?.length || 0;
    const edgeCount = parsedFlowData.edges?.length || 0;

    // Gerar sugestões baseadas na complexidade
    if (currentComplexity > 15) {
      suggestions.push({
        type: 'complexity',
        priority: 'high',
        title: 'Reduzir Complexidade',
        description: 'Workflow muito complexo. Divida em sub-workflows menores.',
        impact: 'Alto',
        effort: 'Médio'
      });
    }

    if (nodeCount > 10) {
      suggestions.push({
        type: 'structure',
        priority: 'medium',
        title: 'Otimizar Estrutura',
        description: 'Agrupe nós similares para melhor organização.',
        impact: 'Médio',
        effort: 'Baixo'
      });
    }

    if (edgeCount > nodeCount * 1.5) {
      suggestions.push({
        type: 'connections',
        priority: 'low',
        title: 'Simplificar Conexões',
        description: 'Reduza o número de conexões desnecessárias.',
        impact: 'Baixo',
        effort: 'Baixo'
      });
    }

    // Sugestões específicas para tipos de nós
    const hasLLMNodes = parsedFlowData.nodes?.some((node: any) => 
      node.data?.category === 'llm'
    );
    
    if (hasLLMNodes) {
      suggestions.push({
        type: 'performance',
        priority: 'medium',
        title: 'Adicionar Cache LLM',
        description: 'Implemente cache para respostas LLM similares.',
        impact: 'Alto',
        effort: 'Médio'
      });
    }

    const hasDocumentLoaders = parsedFlowData.nodes?.some((node: any) => 
      node.data?.category === 'documentloaders'
    );
    
    if (hasDocumentLoaders) {
      suggestions.push({
        type: 'performance',
        priority: 'low',
        title: 'Otimizar Carregamento',
        description: 'Use pré-processamento para documentos grandes.',
        impact: 'Médio',
        effort: 'Alto'
      });
    }

    return NextResponse.json({
      success: true,
      suggestions,
      summary: {
        totalSuggestions: suggestions.length,
        highPriority: suggestions.filter(s => s.priority === 'high').length,
        mediumPriority: suggestions.filter(s => s.priority === 'medium').length,
        lowPriority: suggestions.filter(s => s.priority === 'low').length
      }
    });

  } catch (error) {
    console.error('Erro ao gerar sugestões:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar sugestões' },
      { status: 500 }
    );
  }
}