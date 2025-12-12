'use client';

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { parseTasks, getLayoutedElements } from '@/lib/task-utils';
import { Task, TaskNodeData } from '@/types/task';
import { TaskDialog } from '@/components/TaskDialog';

export function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedTasks = await parseTasks();
        setTasks(loadedTasks);
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(loadedTasks);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    };

    loadData();
  }, [setNodes, setEdges]);

  // URLパラメータからタスクを開く
  const taskIdFromUrl = searchParams.get('task');
  const subtaskIdFromUrl = searchParams.get('subtask');
  
  useEffect(() => {
    if (taskIdFromUrl && tasks.length > 0) {
      const task = tasks.find(t => t.id === taskIdFromUrl);
      if (task) {
        setSelectedTask(task);
        setSelectedNodeId(taskIdFromUrl);
        setIsDialogOpen(true);
      }
    } else if (!taskIdFromUrl) {
      // URLにタスクIDがない場合はダイアログを閉じる
      setIsDialogOpen(false);
      setSelectedTask(null);
      setSelectedNodeId(null);
    }
  }, [taskIdFromUrl, tasks]);

  // 選択されたノードを強調表示
  useEffect(() => {
    if (selectedNodeId) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNodeId) {
            return {
              ...node,
              style: {
                ...node.style,
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)',
                borderColor: '#3b82f6',
                borderWidth: '2px',
              },
            };
          }
          return {
            ...node,
            style: {
              ...node.style,
              boxShadow: undefined,
              borderColor: '#6b7280',
              borderWidth: '1px',
            },
          };
        })
      );
    } else {
      // 選択解除時は元に戻す
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          style: {
            ...node.style,
            boxShadow: undefined,
            borderColor: '#6b7280',
            borderWidth: '1px',
          },
        }))
      );
    }
  }, [selectedNodeId, setNodes]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const taskData = node.data as Task; // Node data contains the full task object
    setSelectedTask(taskData);
    setSelectedNodeId(node.id);
    setIsDialogOpen(true);
    // URLを更新
    const params = new URLSearchParams(window.location.search);
    params.set('task', node.id);
    params.delete('subtask'); // サブタスクパラメータをクリア
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedNodeId(null);
    // URLからパラメータを削除
    const params = new URLSearchParams(window.location.search);
    params.delete('task');
    params.delete('subtask');
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.push(newUrl, { scroll: false });
  }, [router]);

  return (
    <div className="h-screen w-full flex bg-slate-50">
      {/* メインネットワークUI */}
      <div 
        className="relative bg-slate-50 transition-all duration-300 ease-in-out"
        style={{ 
          width: isDialogOpen ? 'calc(100% - 600px)' : '100%',
          flexShrink: 0
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
               return node.style?.background?.toString() || '#eee';
            }}
          />
        </ReactFlow>
        
        {/* 凡例 */}
        <div className="absolute top-4 right-4 bg-white/90 p-3 rounded shadow-lg border text-sm space-y-2 pointer-events-none">
          <div className="font-bold border-b pb-1 mb-1">カテゴリ</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#bfdbfe] border border-gray-400 rounded"></div>
            <span>企画</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#bbf7d0] border border-gray-400 rounded"></div>
            <span>広報</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#fde68a] border border-gray-400 rounded"></div>
            <span>営業</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#e9d5ff] border border-gray-400 rounded"></div>
            <span>制作</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#fecaca] border border-gray-400 rounded"></div>
            <span>運営</span>
          </div>
        </div>
      </div>

      {/* サイドカード */}
      <TaskDialog 
        task={selectedTask} 
        isOpen={isDialogOpen} 
        onClose={handleCloseDialog}
        onSubtaskOpen={(taskId: string, subtaskId: string) => {
          const params = new URLSearchParams(window.location.search);
          params.set('task', taskId);
          params.set('subtask', subtaskId);
          router.push(`?${params.toString()}`, { scroll: false });
        }}
        onSubtaskClose={() => {
          const params = new URLSearchParams(window.location.search);
          params.delete('subtask');
          const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
          router.push(newUrl, { scroll: false });
        }}
        selectedSubtaskId={subtaskIdFromUrl}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">読み込み中...</div>}>
      <HomeContent />
    </Suspense>
  );
}

