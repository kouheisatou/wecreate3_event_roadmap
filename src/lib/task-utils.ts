import Papa from 'papaparse';
import { Task, SubTask } from '@/types/task';
import { Node, Edge, Position } from 'reactflow';
import dagre from 'dagre';

interface TaskRow {
  id: string;
  title: string;
  category: string;
  dependencies: string;
  checklist: string;
  overview: string; // タスクの概要説明
}

interface SubTaskRow {
  task_id: string;
  title: string;
  instructions: string;
  deliverables: string;
  estimated_hours: string;
  template_files: string;
}

export const parseTasks = async (): Promise<Task[]> => {
  // GitHub Pagesのリポジトリ名を設定
  const isProd = process.env.NODE_ENV === 'production';
  const basePath = isProd ? '/wecreate3_event_roadmap' : '';

  const [tasksRes, subtasksRes] = await Promise.all([
    fetch(`${basePath}/tasks.csv`),
    fetch(`${basePath}/subtasks.csv`)
  ]);

  const [tasksCsv, subtasksCsv] = await Promise.all([
    tasksRes.text(),
    subtasksRes.text()
  ]);

  const tasksData = Papa.parse<TaskRow>(tasksCsv, { header: true, skipEmptyLines: true }).data;
  const subtasksData = Papa.parse<SubTaskRow>(subtasksCsv, { header: true, skipEmptyLines: true }).data;

  const subtasksByTaskId = new Map<string, SubTask[]>();
  const templatePromises: Promise<void>[] = [];

  for (let i = 0; i < subtasksData.length; i++) {
    const row = subtasksData[i];
    const taskId = row.task_id;
    if (!subtasksByTaskId.has(taskId)) {
      subtasksByTaskId.set(taskId, []);
    }
    
    const subtask: SubTask = {
      id: `${taskId}-${subtasksByTaskId.get(taskId)!.length + 1}`,
      task_id: taskId,
      title: row.title,
      instructions: row.instructions,
      deliverables: row.deliverables,
      estimated_hours: Number(row.estimated_hours) || 0,
      template_files: row.template_files,
    };

    if (row.template_files) {
      const templatePath = row.template_files;
      // Ensure templatePath starts with a slash
      const normalizedTemplatePath = templatePath.startsWith('/') ? templatePath : `/${templatePath}`;
      
      templatePromises.push(
        fetch(`${basePath}${normalizedTemplatePath}`)
          .then(res => res.ok ? res.text() : '')
          .then(content => {
            subtask.template_content = content;
          })
          .catch(e => {
            console.error(`Failed to load subtask detail: ${templatePath}`, e);
            subtask.template_content = 'サブタスク詳細の読み込みに失敗しました。';
          })
      );
    }

    subtasksByTaskId.get(taskId)!.push(subtask);
  }

  await Promise.all(templatePromises);

  const tasks: Task[] = tasksData.map(row => {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      dependencies: row.dependencies ? row.dependencies.split(',').map(d => d.trim()).filter(Boolean) : [],
      checklist: row.checklist ? row.checklist.split('|').filter(Boolean) : [],
      overview: row.overview || '', // タスクの概要説明
      subtasks: subtasksByTaskId.get(row.id) || [],
    };
  });

  return tasks;
};

const nodeWidth = 200;
const nodeHeight = 80;

export const getLayoutedElements = (tasks: Task[]): { nodes: Node[]; edges: Edge[] } => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: 'LR', align: 'DL', ranksep: 100, nodesep: 30 });

  tasks.forEach((task) => {
    dagreGraph.setNode(task.id, { width: nodeWidth, height: nodeHeight });
  });

  tasks.forEach((task) => {
    task.dependencies.forEach((depId) => {
      dagreGraph.setEdge(depId, task.id);
    });
  });

  dagre.layout(dagreGraph);

  const nodes: Node[] = tasks.map((task) => {
    const nodeWithPosition = dagreGraph.node(task.id);
    
    // カテゴリごとの色分け（機能別カテゴリ）
    let bg = '#fff';
    switch (task.category) {
      case '企画': bg = '#bfdbfe'; break; // 青系 - 企画・戦略
      case '広報': bg = '#bbf7d0'; break; // 緑系 - 広報・集客
      case '営業': bg = '#fde68a'; break; // 黄色系 - 営業・交渉
      case '制作': bg = '#e9d5ff'; break; // 紫系 - デザイン・制作
      case '運営': bg = '#fecaca'; break; // 赤系 - 運営・実行
      default: bg = '#ffffff';
    }

    return {
      id: task.id,
      data: { ...task, label: task.title },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      style: { 
        width: nodeWidth, 
        background: bg,
        border: '1px solid #777',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '12px',
        fontWeight: 'bold',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
      },
      type: 'default',
    };
  });

  const edges: Edge[] = [];
  tasks.forEach((task) => {
    task.dependencies.forEach((depId) => {
      edges.push({
        id: `e${depId}-${task.id}`,
        source: depId,
        target: task.id,
        type: 'default',
        animated: true,
        style: { stroke: '#64748b', strokeWidth: 2 },
      });
    });
  });

  return { nodes, edges };
};
