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
  template_files?: string;
  detail_content?: string; // Google Spreadsheetのdetail_contentカラム
}

/**
 * Google SpreadsheetのCSVエクスポートURLを生成
 * シートIDが指定されていない場合は、シート名を使用してURLを生成
 */
const getGoogleSheetCsvUrl = (spreadsheetId: string, sheetIdOrName: string): string => {
  // シートIDが数値の場合はそのまま使用、そうでなければシート名として扱う
  // シート名の場合は、URLエンコードが必要
  const encodedSheetName = encodeURIComponent(sheetIdOrName);
  // シート名を使用する場合は、gidの代わりにrangeパラメータを使用する方法もあるが、
  // より確実なのはgidを使用すること。シート名からgidを取得するには別の方法が必要
  // ここでは、まずgidを試し、失敗した場合はシート名を使用する方法を試す
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetIdOrName}`;
};

export const parseTasks = async (): Promise<Task[]> => {
  // 環境変数からGoogle Spreadsheetの設定を取得
  // クライアントサイドで実行されるため、NEXT_PUBLIC_プレフィックスが必要
  const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID;
  const tasksSheetId = process.env.NEXT_PUBLIC_GOOGLE_TASKS_SHEET_ID || '0';
  const subtasksSheetId = process.env.NEXT_PUBLIC_GOOGLE_SUBTASKS_SHEET_ID || '0';

  // Google Spreadsheetが設定されている場合はそれを使用、そうでなければローカルCSVファイルを使用
  const useGoogleSheet = !!spreadsheetId;

  let tasksCsv: string;
  let subtasksCsv: string;

  if (useGoogleSheet) {
    // Google Spreadsheetから読み込む
    const tasksUrl = getGoogleSheetCsvUrl(spreadsheetId, tasksSheetId);
    const subtasksUrl = getGoogleSheetCsvUrl(spreadsheetId, subtasksSheetId);

    console.log('Fetching from Google Sheets:', { tasksUrl, subtasksUrl });

    let tasksRes: Response;
    let subtasksRes: Response;

    try {
      [tasksRes, subtasksRes] = await Promise.all([
        fetch(tasksUrl),
        fetch(subtasksUrl)
      ]);
    } catch (error) {
      console.error('Network error fetching Google Sheets:', error);
      throw new Error(
        `Google Spreadsheetへの接続に失敗しました。\n\n` +
        `以下の設定を確認してください:\n` +
        `1. Google Spreadsheetが一般公開（リンクを知っている全員が閲覧可能）に設定されているか\n` +
        `2. スプレッドシートID（NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID）が正しいか\n` +
        `3. シートID（NEXT_PUBLIC_GOOGLE_TASKS_SHEET_ID、NEXT_PUBLIC_GOOGLE_SUBTASKS_SHEET_ID）が正しいか`
      );
    }

    if (!tasksRes.ok) {
      const errorText = await tasksRes.text().catch(() => '');
      console.error('Tasks sheet fetch error:', {
        status: tasksRes.status,
        statusText: tasksRes.statusText,
        url: tasksUrl,
        errorText: errorText.substring(0, 200)
      });
      
      // 400エラーの場合、シートIDが間違っている可能性がある
      if (tasksRes.status === 400) {
        throw new Error(
          `Google Spreadsheetの設定が必要です。\n\n` +
          `タスクシートの取得に失敗しました（400エラー）。\n` +
          `シートID（gid）が正しいか確認してください。\n\n` +
          `現在のシートID: ${tasksSheetId}\n` +
          `URL: ${tasksUrl}\n\n` +
          `シートIDの確認方法:\n` +
          `1. Google Spreadsheetで「tasks」シートのタブをクリック\n` +
          `2. URLに #gid=数字 が表示されます\n` +
          `3. その数字を .env.local の NEXT_PUBLIC_GOOGLE_TASKS_SHEET_ID に設定してください`
        );
      }
      
      throw new Error(
        `Google Spreadsheetの設定が必要です。\n\n` +
        `タスクシートの取得に失敗しました: ${tasksRes.status} ${tasksRes.statusText}\n\n` +
        `以下の設定を確認してください:\n` +
        `1. Google Spreadsheetが一般公開（リンクを知っている全員が閲覧可能）に設定されているか\n` +
        `2. スプレッドシートID（NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID）が正しいか\n` +
        `3. シートID（NEXT_PUBLIC_GOOGLE_TASKS_SHEET_ID）が正しいか`
      );
    }
    
    if (!subtasksRes.ok) {
      const errorText = await subtasksRes.text().catch(() => '');
      console.error('Subtasks sheet fetch error:', {
        status: subtasksRes.status,
        statusText: subtasksRes.statusText,
        url: subtasksUrl,
        errorText: errorText.substring(0, 200)
      });
      
      // 400エラーの場合、シートIDが間違っている可能性がある
      if (subtasksRes.status === 400) {
        throw new Error(
          `Google Spreadsheetの設定が必要です。\n\n` +
          `サブタスクシートの取得に失敗しました（400エラー）。\n` +
          `シートID（gid）が正しいか確認してください。\n\n` +
          `現在のシートID: ${subtasksSheetId}\n` +
          `URL: ${subtasksUrl}\n\n` +
          `シートIDの確認方法:\n` +
          `1. Google Spreadsheetで「subtasks」シートのタブをクリック\n` +
          `2. URLに #gid=数字 が表示されます\n` +
          `3. その数字を .env.local の NEXT_PUBLIC_GOOGLE_SUBTASKS_SHEET_ID に設定してください`
        );
      }
      
      throw new Error(
        `Google Spreadsheetの設定が必要です。\n\n` +
        `サブタスクシートの取得に失敗しました: ${subtasksRes.status} ${subtasksRes.statusText}\n\n` +
        `以下の設定を確認してください:\n` +
        `1. Google Spreadsheetが一般公開（リンクを知っている全員が閲覧可能）に設定されているか\n` +
        `2. スプレッドシートID（NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID）が正しいか\n` +
        `3. シートID（NEXT_PUBLIC_GOOGLE_SUBTASKS_SHEET_ID）が正しいか`
      );
    }

    tasksCsv = await tasksRes.text();
    subtasksCsv = await subtasksRes.text();
  } else {
    // ローカルCSVファイルから読み込む（フォールバック）
    const isProd = process.env.NODE_ENV === 'production';
    const basePath = isProd ? '/wecreate3_event_roadmap' : '';

    const [tasksRes, subtasksRes] = await Promise.all([
      fetch(`${basePath}/tasks.csv`),
      fetch(`${basePath}/subtasks.csv`)
    ]);

    tasksCsv = await tasksRes.text();
    subtasksCsv = await subtasksRes.text();
  }

  const tasksData = Papa.parse<TaskRow>(tasksCsv, { header: true, skipEmptyLines: true }).data;
  const subtasksData = Papa.parse<SubTaskRow>(subtasksCsv, { header: true, skipEmptyLines: true }).data;

  const subtasksByTaskId = new Map<string, SubTask[]>();

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

    // detail_contentカラムが存在する場合はそれを使用（Google Spreadsheet形式）
    if (row.detail_content) {
      subtask.template_content = row.detail_content;
    } else if (row.template_files && !useGoogleSheet) {
      // フォールバック: ローカルファイルから読み込む場合のみ
      const templatePath = row.template_files;
      const normalizedTemplatePath = templatePath.startsWith('/') ? templatePath : `/${templatePath}`;
      const isProd = process.env.NODE_ENV === 'production';
      const basePath = isProd ? '/wecreate3_event_roadmap' : '';
      
      try {
        const res = await fetch(`${basePath}${normalizedTemplatePath}`);
        if (res.ok) {
          subtask.template_content = await res.text();
        } else {
          subtask.template_content = 'サブタスク詳細の読み込みに失敗しました。';
        }
      } catch (e) {
        console.error(`Failed to load subtask detail: ${templatePath}`, e);
        subtask.template_content = 'サブタスク詳細の読み込みに失敗しました。';
      }
    }

    subtasksByTaskId.get(taskId)!.push(subtask);
  }

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
