import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

interface StudioWorkflowRequest {
  action: 'import_workflow' | 'export_workflow' | 'create_workflow' | 'get_imported_workflows';
  data: {
    workflow?: any;
    source?: 'flowise_learning' | 'agents' | 'manual' | 'learning';
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, data }: StudioWorkflowRequest = body;

    if (!action || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: action, data' },
        { status: 400 }
      );
    }

    const { workflow, source } = data;

    switch (action) {
      case 'import_workflow':
        return await handleImportWorkflow(workflow, source, session.user.id);
      
      case 'export_workflow':
        return await handleExportWorkflow(workflow, session.user.id);
      
      case 'create_workflow':
        return await handleCreateWorkflow(workflow, session.user.id);
      
      case 'get_imported_workflows':
        return await handleGetImportedWorkflows(source, session.user.id);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Studio workflow API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleImportWorkflow(workflow: any, source: string, userId: string) {
  try {
    console.log(`📥 Importing workflow to Studio: ${workflow.name} from ${source}`);

    // Verificar se já existe um workflow com o mesmo nome
    const existingWorkflow = await db.studioWorkflow.findFirst({
      where: {
        name: workflow.name,
        userId
      }
    });

    if (existingWorkflow) {
      return NextResponse.json({
        success: false,
        error: 'Workflow with this name already exists in Studio'
      }, { status: 409 });
    }

    // Criar workflow no Studio
    const studioWorkflow = await db.studioWorkflow.create({
      data: {
        name: workflow.name,
        description: `Imported from ${source}: ${workflow.name}`,
        type: workflow.type || 'CHATFLOW',
        flowData: workflow.flowData || '{}',
        config: JSON.stringify({
          source,
          originalId: workflow.id,
          importedAt: new Date().toISOString(),
          complexity: workflow.complexityScore || 0,
          nodeCount: workflow.nodeCount || 0,
          deployed: workflow.deployed || false
        }),
        status: 'draft',
        userId,
        workspaceId: workflow.workspaceId || null
      }
    });

    // Registrar no audit log
    await db.auditLog.create({
      data: {
        action: 'import',
        entityType: 'studio_workflow',
        entityId: studioWorkflow.id,
        userId,
        newValues: JSON.stringify({
          name: workflow.name,
          source,
          originalId: workflow.id
        }),
        ipAddress: 'unknown', // Não disponível neste contexto
        userAgent: 'unknown'
      }
    });

    console.log(`✅ Workflow imported to Studio successfully: ${studioWorkflow.id}`);

    return NextResponse.json({
      success: true,
      message: `Workflow "${workflow.name}" imported to Studio successfully`,
      workflow: {
        id: studioWorkflow.id,
        name: studioWorkflow.name,
        status: studioWorkflow.status,
        importedAt: studioWorkflow.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error importing workflow to Studio:', error);
    throw error;
  }
}

async function handleExportWorkflow(workflow: any, userId: string) {
  try {
    console.log(`📤 Exporting workflow from Studio: ${workflow.name}`);

    // Verificar se o workflow existe e pertence ao usuário
    const existingWorkflow = await db.studioWorkflow.findFirst({
      where: {
        id: workflow.id,
        userId
      }
    });

    if (!existingWorkflow) {
      return NextResponse.json({
        success: false,
        error: 'Workflow not found or access denied'
      }, { status: 404 });
    }

    // Preparar dados para exportação
    const exportData = {
      id: existingWorkflow.id,
      name: existingWorkflow.name,
      description: existingWorkflow.description,
      type: existingWorkflow.type,
      flowData: existingWorkflow.flowData,
      config: JSON.parse(existingWorkflow.config || '{}'),
      status: existingWorkflow.status,
      exportedAt: new Date().toISOString()
    };

    // Registrar no audit log
    await db.auditLog.create({
      data: {
        action: 'export',
        entityType: 'studio_workflow',
        entityId: existingWorkflow.id,
        userId,
        newValues: JSON.stringify({
          exportedAt: exportData.exportedAt
        }),
        ipAddress: 'unknown',
        userAgent: 'unknown'
      }
    });

    console.log(`✅ Workflow exported from Studio successfully: ${existingWorkflow.id}`);

    return NextResponse.json({
      success: true,
      message: `Workflow "${workflow.name}" exported successfully`,
      data: exportData
    });

  } catch (error) {
    console.error('❌ Error exporting workflow from Studio:', error);
    throw error;
  }
}

async function handleCreateWorkflow(workflow: any, userId: string) {
  try {
    console.log(`🔨 Creating new workflow in Studio: ${workflow.name}`);

    // Criar novo workflow no Studio
    const studioWorkflow = await db.studioWorkflow.create({
      data: {
        name: workflow.name,
        description: workflow.description || `Created workflow: ${workflow.name}`,
        type: workflow.type || 'CHATFLOW',
        flowData: workflow.flowData || '{}',
        config: JSON.stringify(workflow.config || {}),
        status: 'draft',
        userId,
        workspaceId: workflow.workspaceId || null
      }
    });

    // Registrar no audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        entityType: 'studio_workflow',
        entityId: studioWorkflow.id,
        userId,
        newValues: JSON.stringify({
          name: workflow.name,
          type: workflow.type
        }),
        ipAddress: 'unknown',
        userAgent: 'unknown'
      }
    });

    console.log(`✅ Workflow created in Studio successfully: ${studioWorkflow.id}`);

    return NextResponse.json({
      success: true,
      message: `Workflow "${workflow.name}" created successfully`,
      workflow: {
        id: studioWorkflow.id,
        name: studioWorkflow.name,
        status: studioWorkflow.status,
        createdAt: studioWorkflow.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating workflow in Studio:', error);
    throw error;
  }
}

async function handleGetImportedWorkflows(source: string, userId: string) {
  try {
    console.log(`📋 Getting imported workflows from source: ${source}`);

    // Get all workflows for the user first
    const workflows = await db.studioWorkflow.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter workflows based on source in memory (since SQLite doesn't support JSON path queries)
    let filteredWorkflows = workflows;
    
    if (source === 'learning') {
      filteredWorkflows = workflows.filter(workflow => {
        try {
          const config = JSON.parse(workflow.config || '{}');
          return config.source === 'flowise_learning' || 
                 config.source === 'learning' ||
                 workflow.description?.includes('Imported from learning') ||
                 workflow.description?.includes('Imported from flowise_learning');
        } catch {
          return false;
        }
      });
    }

    // Format the workflows for the frontend
    const formattedWorkflows = filteredWorkflows.map(workflow => {
      const config = JSON.parse(workflow.config || '{}');
      
      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        type: workflow.type,
        complexityScore: workflow.complexityScore || config.complexity || 0,
        nodeCount: workflow.nodeCount || config.nodeCount || 0,
        edgeCount: workflow.edgeCount || config.edgeCount || 0,
        importedAt: config.importedAt || workflow.createdAt.toISOString(),
        source: workflow.source || config.source || source,
        status: workflow.status,
        flowData: workflow.flowData || '{}'
      };
    });

    console.log(`✅ Found ${formattedWorkflows.length} imported workflows`);

    return NextResponse.json({
      workflows: formattedWorkflows,
      total: formattedWorkflows.length
    });

  } catch (error) {
    console.error('❌ Error getting imported workflows:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Construir filtro
    const where: any = {
      userId: session.user.id
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Buscar workflows com paginação
    const [workflows, total] = await Promise.all([
      db.studioWorkflow.findMany({
        where,
        include: {
          workspace: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.studioWorkflow.count({ where })
    ]);

    // Formatar resposta
    const formattedWorkflows = workflows.map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      type: workflow.type,
      status: workflow.status,
      workspace: workflow.workspace,
      config: JSON.parse(workflow.config || '{}'),
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString()
    }));

    return NextResponse.json({
      workflows: formattedWorkflows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Studio workflow listing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}