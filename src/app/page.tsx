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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedNodeId(null);
  }, []);

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
          <div className="font-bold border-b pb-1 mb-1">フェーズ</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#bfdbfe] border border-gray-400 rounded"></div>
            <span>企画 (2タスク)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#bbf7d0] border border-gray-400 rounded"></div>
            <span>準備 (9タスク)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#fed7aa] border border-gray-400 rounded"></div>
            <span>直前 (1タスク)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#fca5a5] border border-gray-400 rounded"></div>
            <span>当日 (2タスク)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#d1d5db] border border-gray-400 rounded"></div>
            <span>事後 (2タスク)</span>
          </div>
        </div>
      </div>

      {/* サイドカード */}
      <TaskDialog 
        task={selectedTask} 
        isOpen={isDialogOpen} 
        onClose={handleCloseDialog} 
      />
    </div>
  );
}

