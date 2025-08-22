'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, BarChart3, Target, TrendingUp, Brain, Workflow, Users, Database } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import ElegantCard from '@/components/ui/ElegantCard';
import FlowiseLearningManager from '@/components/FlowiseLearningManager';

export default function LearningPage() {
  const pathname = usePathname();
  const [stats, setStats] = useState({
    totalExecutions: 0,
    successRate: 100,
    averageResponseTime: 1.2,
    activeAgents: 0,
    learnedTemplates: 0,
    validatedTemplates: 0,
    flowiseWorkflows: 0
  });

  useEffect(() => {
    // Simular carregamento de estatísticas
    const loadStats = async () => {
      try {
        const response = await fetch('/api/agents');
        if (response.ok) {
          const data = await response.json();
          // The API returns { agents: [...] } so we need to extract the agents array
          const agents = data.agents || [];
          setStats(prev => ({
            ...prev,
            activeAgents: Array.isArray(agents) ? agents.filter(agent => agent.status === 'active').length : 0
          }));
        }

        // Carregar estatísticas do Flowise Learning
        const templatesResponse = await fetch('/api/v1/learning/templates');
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          const templates = templatesData.templates || [];
          setStats(prev => ({
            ...prev,
            learnedTemplates: templates.length,
            validatedTemplates: templates.filter(t => t.validated).length
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      }
    };

    loadStats();
  }, []);

  return (
    <MainLayout currentPath={pathname}>
      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ElegantCard
            title="Total de Execuções"
            description="Execuções realizadas"
            icon={BarChart3}
            iconColor="text-blue-600"
            bgColor="bg-blue-100 dark:bg-blue-900/20"
            value={stats.totalExecutions}
            badge="Histórico completo"
            badgeColor="bg-blue-50 text-blue-700 border-blue-200"
          />
          
          <ElegantCard
            title="Taxa de Sucesso"
            description="Média de acertos"
            icon={Target}
            iconColor="text-green-600"
            bgColor="bg-green-100 dark:bg-green-900/20"
            value={`${stats.successRate}%`}
            badge="Excelente desempenho"
            badgeColor="bg-green-50 text-green-700 border-green-200"
          />
          
          <ElegantCard
            title="Templates Aprendidos"
            description="Do Flowise"
            icon={Brain}
            iconColor="text-purple-600"
            bgColor="bg-purple-100 dark:bg-purple-900/20"
            value={stats.learnedTemplates}
            badge={`${stats.validatedTemplates} validados`}
            badgeColor="bg-purple-50 text-purple-700 border-purple-200"
          />
          
          <ElegantCard
            title="Agentes Ativos"
            description="Em operação"
            icon={BookOpen}
            iconColor="text-orange-600"
            bgColor="bg-orange-100 dark:bg-orange-900/20"
            value={stats.activeAgents}
            badge={stats.activeAgents > 0 ? "Prontos para uso" : undefined}
            badgeColor="bg-orange-50 text-orange-700 border-orange-200"
          />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sistema de Aprendizado</h1>
            <p className="text-lg text-muted-foreground">
              Acompanhe o desempenho e evolução dos seus agentes de IA e templates aprendidos
            </p>
          </div>
          <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 shadow-lg">
            <BookOpen className="w-4 h-4 mr-2" />
            Ver Estatísticas Detalhadas
          </Button>
        </div>

        {/* Learning System Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="flowise" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Flowise Learning
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Agentes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Learning Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ElegantCard
                title="Análise de Desempenho"
                description="Acompanhe métricas detalhadas de performance de cada agente"
                icon={BarChart3}
                iconColor="text-blue-600"
                bgColor="bg-blue-100 dark:bg-blue-900/20"
                badge="Em tempo real"
                badgeColor="bg-blue-50 text-blue-700 border-blue-200"
              >
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Precisão</span>
                    <span className="font-medium text-blue-600">94%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Velocidade</span>
                    <span className="font-medium text-green-600">1.2s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Satisfação</span>
                    <span className="font-medium text-purple-600">4.8/5</span>
                  </div>
                </div>
              </ElegantCard>

              <ElegantCard
                title="Otimização Automática"
                description="Melhorias automáticas baseadas em padrões de uso"
                icon={Target}
                iconColor="text-green-600"
                bgColor="bg-green-100 dark:bg-green-900/20"
                badge="Inteligente"
                badgeColor="bg-green-50 text-green-700 border-green-200"
              >
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Otimizações</span>
                    <span className="font-medium text-blue-600">23</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Melhorias</span>
                    <span className="font-medium text-green-600">+15%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Eficiência</span>
                    <span className="font-medium text-purple-600">89%</span>
                  </div>
                </div>
              </ElegantCard>

              <ElegantCard
                title="Evolução Contínua"
                description="Aprendizado contínuo e adaptação a novos cenários"
                icon={TrendingUp}
                iconColor="text-purple-600"
                bgColor="bg-purple-100 dark:bg-purple-900/20"
                badge="Adaptativo"
                badgeColor="bg-purple-50 text-purple-700 border-purple-200"
              >
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Atualizações</span>
                    <span className="font-medium text-blue-600">12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Novas Habilidades</span>
                    <span className="font-medium text-green-600">8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Adaptação</span>
                    <span className="font-medium text-purple-600">96%</span>
                  </div>
                </div>
              </ElegantCard>
            </div>

            {/* Recent Activity */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Atividade Recente</CardTitle>
                <CardDescription>
                  Últimas atualizações e melhorias do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Agente otimizado automaticamente</p>
                      <p className="text-xs text-muted-foreground">Analisador de Código - melhoria de 12% na precisão</p>
                    </div>
                    <span className="text-xs text-muted-foreground">2 min atrás</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Novo padrão identificado</p>
                      <p className="text-xs text-muted-foreground">Padrão de otimização de API detectado e aplicado</p>
                    </div>
                    <span className="text-xs text-muted-foreground">15 min atrás</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Template Flowise validado</p>
                      <p className="text-xs text-muted-foreground">Customer Support Bot - template pronto para uso</p>
                    </div>
                    <span className="text-xs text-muted-foreground">1 hora atrás</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flowise">
            <FlowiseLearningManager />
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Aprendizado de Agentes</CardTitle>
                <CardDescription>
                  Gerencie o aprendizado e otimização dos seus agentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Gerenciamento de Agentes</h3>
                  <p className="text-muted-foreground mb-4">
                    Aqui você poderá gerenciar o aprendizado individual de cada agente, 
                    acompanhar métricas de performance e configurar otimizações automáticas.
                  </p>
                  <Button variant="outline">
                    Em breve disponível
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Analytics de Aprendizado</CardTitle>
                <CardDescription>
                  Análise detalhada do desempenho do sistema de aprendizado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Database className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Análise Avançada</h3>
                  <p className="text-muted-foreground mb-4">
                    Relatórios detalhados, gráficos de evolução e insights 
                    sobre o desempenho do sistema de aprendizado.
                  </p>
                  <Button variant="outline">
                    Em breve disponível
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}