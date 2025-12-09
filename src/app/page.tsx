'use client';

import React, { useCallback, useEffect, useState } from 'react';
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

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const tasks = await parseTasks();
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(tasks);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    };

    loadData();
  }, [setNodes, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const taskData = node.data as Task; // Node data contains the full task object
    setSelectedTask(taskData);
    setIsDialogOpen(true);
  }, []);

  return (
    <div className="h-screen w-full flex flex-col">
      <header className="bg-slate-900 text-white p-4 shadow-md z-10">
        <h1 className="text-xl font-bold flex items-center gap-2">
          📅 Event Task Manager
        </h1>
        <p className="text-xs text-slate-300">イベント開催のためのタスクネットワークマニュアル</p>
      </header>
      
      <div className="flex-1 relative bg-slate-50">
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
        <div className="absolute top-4 right-4 bg-white/90 p-3 rounded shadow-lg border text-xs space-y-2 pointer-events-none">
          <div className="font-bold border-b pb-1 mb-1">カテゴリ</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-100 border border-gray-400 rounded"></div>企画</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-pink-100 border border-gray-400 rounded"></div>会場</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-100 border border-gray-400 rounded"></div>スポンサー</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-100 border border-gray-400 rounded"></div>広報</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-100 border border-gray-400 rounded"></div>デザイン</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-100 border border-gray-400 rounded"></div>運営</div>
        </div>
      </div>

      <TaskDialog 
        task={selectedTask} 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </div>
  );
}

