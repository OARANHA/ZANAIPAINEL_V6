# Flowise Learning System

## Visão Geral

O Flowise Learning System é uma nova funcionalidade do ZANAI PAINEL V6 que permite aprender com workflows reais do Flowise para criar templates de alta qualidade para agentes Zanai. Este sistema resolve o problema da criação de proxies simples que podem não funcionar bem com a complexa arquitetura do Flowise.

## Arquitetura do Sistema

### Fluxo de Aprendizado

```
Flowise Real → Zanai (Aprendizado) → Validação Humana → Template Aprendido → Uso para Criação de Agentes
```

### Componentes Principais

#### 1. Modelo de Dados: LearnedTemplate

```typescript
model LearnedTemplate {
  id                    String   @id @default(cuid())
  sourceWorkflowId     String   // ID do workflow original no Flowise
  name                  String
  category              String   // Categoria do template
  complexity            String   // 'simple', 'medium', 'complex'
  patterns              String   // JSON com padrões extraídos
  zanaiConfig           String   // JSON com configuração simplificada para Zanai
  validated             Boolean  @default(false) // Se foi validado por humano
  usageCount            Int      @default(0) // Quantas vezes foi usado
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

#### 2. FlowiseLearningManager

Componente React que gerencia a interface de aprendizado, incluindo:
- Importação de workflows do Flowise
- Análise e extração de padrões
- Validação humana dos templates
- Gerenciamento de templates aprendidos

#### 3. API Endpoints

- `POST /api/v1/flowise-workflows/learning` - Analisa workflow e extrai padrões
- `GET /api/v1/flowise-workflows/learning/templates` - Lista templates aprendidos
- `POST /api/v1/flowise-workflows/learning/templates/[id]/validate` - Valida template
- `POST /api/v1/flowise-workflows/learning/templates/[id]/use` - Registra uso do template

## Funcionalidades

### 1. Análise de Workflows

O sistema analisa workflows do Flowise para extrair:
- **Padrões de Conexão**: Como os nós são conectados
- **Padrões de Configuração**: Configurações comuns entre nós
- **Padrões de Fluxo**: Sequências lógicas de operações
- **Complexidade**: Nível de complexidade do workflow

### 2. Extração de Templates

A partir da análise, o sistema cria templates que incluem:
- **Estrutura Básica**: Configuração simplificada para Zanai
- **Padrões Reutilizáveis**: Componentes que podem ser aplicados a múltiplos agentes
- **Mapeamento de Nós**: Correspondência entre nós Flowise e funcionalidades Zanai
- **Configurações Otimizadas**: Parâmetros pré-configurados com base em casos reais

### 3. Validação Humana

Todos os templates passam por validação humana:
- **Revisão de Qualidade**: Verificação se o template representa bem o workflow original
- **Ajustes Manuais**: Possibilidade de ajustar configurações extraídas
- **Aprovação**: Apenas templates validados podem ser usados para criação de agentes

### 4. Uso de Templates

Templates validados podem ser usados para:
- **Criação de Agentes**: Gerar agentes com base em templates aprendidos
- **Melhoria Contínua**: O sistema aprende com o uso dos templates
- **Métricas de Sucesso**: Acompanhar performance dos templates

## Vantagens do Sistema

### Segurança
- ✅ **Baseado em Workflows Reais**: Aprende com funcionalidades que já funcionam
- ✅ **Validação Humana**: Garante qualidade antes do uso
- ✅ **Rastreabilidade**: Todos os templates têm origem documentada

### Qualidade
- ✅ **Casos Reais**: Baseado em workflows que resolvem problemas reais
- ✅ **Otimização Contínua**: Melhora com o uso e feedback
- ✅ **Padrões Comprovados**: Extrai o que funciona melhor na prática

### Escalabilidade
- ✅ **Aprendizado Contínuo**: Quanto mais workflows importar, mais inteligente fica
- ✅ **Categorização**: Organiza templates por categoria e complexidade
- ✅ **Reutilização**: Templates podem ser aplicados a múltiplos cenários

## Como Usar

### 1. Acessar o Sistema

Navegue para `/admin/flowise-learning` para acessar a interface de aprendizado.

### 2. Importar Workflow

1. Clique em "Importar Workflow do Flowise"
2. Insira o ID do workflow ou URL do Flowise
3. O sistema irá analisar e extrair padrões

### 3. Validar Template

1. Revise o template gerado
2. Ajuste configurações se necessário
3. Aproveve o template para uso

### 4. Usar Template

1. Na criação de agentes, selecione "Usar Template Aprendido"
2. Escolha o template desejado
3. O sistema irá pré-configurar o agente baseado no template

## API Reference

### POST /api/v1/flowise-workflows/learning

Analisa um workflow do Flowise e extrai padrões.

**Request:**
```json
{
  "workflowId": "workflow_123",
  "flowiseUrl": "https://flowise.example.com"
}
```

**Response:**
```json
{
  "success": true,
  "template": {
    "id": "template_123",
    "name": "Customer Support Bot",
    "category": "customer_service",
    "complexity": "medium",
    "patterns": {...},
    "zanaiConfig": {...},
    "validated": false
  }
}
```

### GET /api/v1/flowise-workflows/learning/templates

Lista todos os templates aprendidos.

**Response:**
```json
{
  "templates": [
    {
      "id": "template_123",
      "name": "Customer Support Bot",
      "category": "customer_service",
      "complexity": "medium",
      "validated": true,
      "usageCount": 5,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/v1/flowise-workflows/learning/templates/[id]/validate

Valida um template para uso.

**Request:**
```json
{
  "validated": true,
  "notes": "Template validado e ajustado para melhor performance"
}
```

## Melhorias Futuras

1. **Aprendizado Automático**: Sistema que automaticamente valida templates baseado em métricas
2. **Exportação para Flowise**: Exportar agentes melhorados de volta para Flowise
3. **Sistema de Recomendação**: Recomendar templates baseado no contexto do usuário
4. **Análise de Performance**: Métricas detalhadas de performance dos templates
5. **Versionamento**: Controle de versões dos templates

## Integração com o Sistema Existente

O Flowise Learning System se integra perfeitamente com o sistema existente:

- **Agent Creation**: Templates podem ser usados na criação de agentes
- **Flowise Integration**: Mantém sincronização com workflows do Flowise
- **Analytics**: Fornece métricas sobre uso e performance dos templates
- **Admin Interface**: Interface completa de gerenciamento no painel administrativo

## Conclusão

O Flowise Learning System representa uma evolução significativa na integração entre Zanai e Flowise, permitindo que o sistema aprenda com casos reais e crie agentes de alta qualidade com base em workflows comprovados. Isso resolve o problema fundamental da criação de proxies simples e estabelece uma base sólida para integrações futuras.