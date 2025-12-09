export interface SubTask {
  id: string; // "task_id-index"
  task_id: string;
  title: string;
  instructions: string;
  deliverables: string;
  estimated_hours: number;
  template_files?: string;
  template_content?: string;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  dependencies: string[];
  checklist: string[];
  overview: string; // タスクの概要説明
  subtasks: SubTask[];
}

import { Node } from 'reactflow';

export interface TaskNodeData extends Task {
  label: string;
}

export type TaskNode = Node<TaskNodeData>;
