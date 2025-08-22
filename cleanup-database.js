const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDatabase() {
  try {
    console.log('Iniciando limpeza do banco de dados...');
    
    // Encontrar o usuário superadmin
    const superAdmin = await prisma.user.findFirst({
      where: { 
        OR: [
          { role: 'super_admin' },
          { role: 'admin' }
        ]
      }
    });
    
    if (!superAdmin) {
      console.log('Nenhum usuário superadmin encontrado. Criando um...');
      
      // Verificar se o email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: 'superadmin@zanai.com' }
      });
      
      if (existingUser) {
        // Atualizar usuário existente para superadmin
        const updatedSuperAdmin = await prisma.user.update({
          where: { email: 'superadmin@zanai.com' },
          data: { role: 'super_admin' }
        });
        console.log('Usuário atualizado para superadmin:', updatedSuperAdmin.email);
      } else {
        // Criar usuário superadmin padrão
        const newSuperAdmin = await prisma.user.create({
          data: {
            email: 'superadmin@zanai.com',
            name: 'Super Admin',
            role: 'super_admin'
          }
        });
        console.log('Superadmin criado:', newSuperAdmin.email);
      }
    } else {
      console.log('Superadmin encontrado:', superAdmin.email);
    }
    
    // Deletar na ordem correta para respeitar foreign keys
    
    // 1. Deletar execuções e métricas primeiro
    console.log('Deletando execuções de agentes...');
    const deletedAgentExecutions = await prisma.agentExecution.deleteMany({
      where: {
        agent: {
          userId: { not: superAdmin?.id }
        }
      }
    });
    console.log(`${deletedAgentExecutions.count} execuções de agentes deletadas.`);
    
    console.log('Deletando métricas...');
    const deletedMetrics = await prisma.agentMetrics.deleteMany({
      where: {
        agent: {
          userId: { not: superAdmin?.id }
        }
      }
    });
    console.log(`${deletedMetrics.count} métricas deletadas.`);
    
    console.log('Deletando aprendizados...');
    const deletedLearnings = await prisma.learning.deleteMany({
      where: {
        agent: {
          userId: { not: superAdmin?.id }
        }
      }
    });
    console.log(`${deletedLearnings.count} aprendizados deletados.`);
    
    // 2. Deletar conexões MCP
    console.log('Deletando conexões MCP...');
    const deletedMCPConnections = await prisma.mCPConnection.deleteMany({
      where: {
        agentId: {
          not: superAdmin?.id
        }
      }
    });
    console.log(`${deletedMCPConnections.count} conexões MCP deletadas.`);
    
    // 3. Deletar servidores MCP
    console.log('Deletando servidores MCP...');
    const deletedMCPServers = await prisma.mCPServer.deleteMany({
      where: {
        workspaceId: {
          not: superAdmin?.id
        }
      }
    });
    console.log(`${deletedMCPServers.count} servidores MCP deletados.`);
    
    // 4. Deletar execuções de composições
    console.log('Deletando execuções...');
    const deletedExecutions = await prisma.execution.deleteMany({
      where: {
        composition: {
          workspace: {
            userId: { not: superAdmin?.id }
          }
        }
      }
    });
    console.log(`${deletedExecutions.count} execuções deletadas.`);
    
    // 5. Deletar composições
    console.log('Deletando composições...');
    const deletedCompositions = await prisma.composition.deleteMany({
      where: {
        workspace: {
          userId: { not: superAdmin?.id }
        }
      }
    });
    console.log(`${deletedCompositions.count} composições deletadas.`);
    
    // 6. Deletar agentes
    console.log('Deletando agentes...');
    const deletedAgents = await prisma.agent.deleteMany({
      where: {
        OR: [
          { userId: { not: superAdmin?.id } },
          { userId: null }
        ]
      }
    });
    console.log(`${deletedAgents.count} agentes deletados.`);
    
    // 7. Deletar workspaces
    console.log('Deletando workspaces...');
    const deletedWorkspaces = await prisma.workspace.deleteMany({
      where: {
        userId: { not: superAdmin?.id }
      }
    });
    console.log(`${deletedWorkspaces.count} workspaces deletados.`);
    
    // 8. Deletar clientes
    console.log('Deletando clientes...');
    const deletedClients = await prisma.client.deleteMany({
      where: {
        userId: { not: superAdmin?.id }
      }
    });
    console.log(`${deletedClients.count} clientes deletados.`);
    
    // 9. Deletar empresas
    console.log('Deletando empresas...');
    const deletedCompanies = await prisma.company.deleteMany({
      where: {
        users: {
          none: {
            id: superAdmin?.id
          }
        }
      }
    });
    console.log(`${deletedCompanies.count} empresas deletadas.`);
    
    // 10. Deletar dados do Flowise
    console.log('Deletando execuções do Flowise...');
    const deletedFlowiseExecutions = await prisma.flowiseExecution.deleteMany({});
    console.log(`${deletedFlowiseExecutions.count} execuções Flowise deletadas.`);
    
    console.log('Deletando workflows do Flowise...');
    const deletedFlowiseWorkflows = await prisma.flowiseWorkflow.deleteMany({});
    console.log(`${deletedFlowiseWorkflows.count} workflows Flowise deletados.`);
    
    console.log('Deletando templates aprendidos...');
    const deletedTemplates = await prisma.learnedTemplate.deleteMany({});
    console.log(`${deletedTemplates.count} templates aprendidos deletados.`);
    
    console.log('Deletando logs de sincronização...');
    const deletedSyncLogs = await prisma.syncLog.deleteMany({});
    console.log(`${deletedSyncLogs.count} logs de sincronização deletados.`);
    
    console.log('✅ Limpeza do banco de dados concluída com sucesso!');
    console.log('📊 Resumo:');
    console.log(`   - Superadmin mantido: ${superAdmin?.email || 'Novo superadmin criado'}`);
    console.log(`   - Agentes deletados: ${deletedAgents.count}`);
    console.log(`   - Workspaces deletados: ${deletedWorkspaces.count}`);
    console.log(`   - Clientes deletados: ${deletedClients.count}`);
    console.log(`   - Empresas deletadas: ${deletedCompanies.count}`);
    console.log(`   - Workflows Flowise deletados: ${deletedFlowiseWorkflows.count}`);
    console.log(`   - Templates aprendidos deletados: ${deletedTemplates.count}`);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a limpeza
cleanupDatabase()
  .then(() => {
    console.log('🎉 Banco de dados limpo e pronto para sincronização!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha na limpeza do banco de dados:', error);
    process.exit(1);
  });