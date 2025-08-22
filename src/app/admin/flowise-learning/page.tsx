import FlowiseLearningManager from '@/components/FlowiseLearningManager';
import MainLayout from '@/components/layout/MainLayout';

export default function FlowiseLearningPage() {
  return (
    <MainLayout currentPath="/admin/flowise-learning">
      <div className="container mx-auto px-4 py-8">
        <FlowiseLearningManager />
      </div>
    </MainLayout>
  );
}