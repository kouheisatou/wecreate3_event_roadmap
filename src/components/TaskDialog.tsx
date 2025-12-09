import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { Task } from '@/types/task';
import { X, CheckSquare, Lightbulb, Copy, FileText, ArrowLeft, Target, HelpCircle, Clock, Box } from 'lucide-react';

interface TaskDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDialog: React.FC<TaskDialogProps> = ({ task, isOpen, onClose }) => {
  const [viewingTemplate, setViewingTemplate] = useState<{ title: string; content: string } | null>(null);

  if (!task) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('コピーしました');
  };

  const handleClose = () => {
    setViewingTemplate(null);
    onClose();
  };

  const TemplateViewer = ({ title, content, onBack }: { title: string, content: string, onBack: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 border-b pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <Dialog.Title className="text-lg font-bold text-gray-900 m-0 truncate max-w-[500px]">
            テンプレート: {title}
          </Dialog.Title>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => copyToClipboard(content)}
            className="text-xs flex items-center gap-1 bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 transition-colors shadow-sm font-medium"
          >
            <Copy size={14} />
            コピー
          </button>
          <Dialog.Close asChild>
            <button
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Close"
              onClick={handleClose}
            >
              <X size={24} />
            </button>
          </Dialog.Close>
        </div>
      </div>
      <ScrollArea.Root className="flex-1 w-full h-full overflow-hidden bg-white rounded relative border border-gray-100">
        <ScrollArea.Viewport className="w-full h-full rounded p-4">
          <pre className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-mono">
            {content}
          </pre>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-[160ms] ease-out hover:bg-gray-200 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5">
          <ScrollArea.Thumb className="flex-1 bg-gray-300 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-overlayShow z-40" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[95vw] max-w-[1000px] h-[85vh] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none data-[state=open]:animate-contentShow overflow-hidden flex flex-col z-50">
          
          {viewingTemplate ? (
            <TemplateViewer 
              title={viewingTemplate.title} 
              content={viewingTemplate.content} 
              onBack={() => setViewingTemplate(null)} 
            />
          ) : (
            <>
              {/* Header */}
              <div className="flex justify-between items-start mb-4 border-b pb-4 flex-shrink-0">
                <div className="pr-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 uppercase tracking-wider">
                      {task.category}
                    </span>
                  </div>
                  <Dialog.Title className="text-2xl font-bold text-gray-900 m-0">
                    {task.title}
                  </Dialog.Title>
                </div>
                <Dialog.Close asChild>
                  <button
                    className="text-gray-400 hover:text-gray-500 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                  >
                    <X size={24} />
                  </button>
                </Dialog.Close>
              </div>

              {/* Body */}
              <ScrollArea.Root className="flex-1 w-full h-full overflow-hidden bg-white rounded relative">
                <ScrollArea.Viewport className="w-full h-full rounded">
                  <div className="space-y-8 pr-4 pb-4">
                    
                    {/* Checklist & Reason */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <section className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                        <h3 className="flex items-center text-sm font-bold text-blue-800 mb-3 uppercase tracking-wide">
                          <CheckSquare size={18} className="mr-2" />
                          完了定義（チェックリスト）
                        </h3>
                        <ul className="space-y-2">
                          {task.checklist && task.checklist.length > 0 ? (
                            task.checklist.map((item, i) => (
                              <li key={i} className="flex items-start text-blue-900 text-base font-medium leading-relaxed">
                                <input 
                                  type="checkbox" 
                                  className="mt-1.5 mr-3 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 flex-shrink-0 pointer-events-none"
                                  readOnly
                                />
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-blue-900/60 italic">（設定されていません）</li>
                          )}
                        </ul>
                      </section>
                      <section className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                        <h3 className="flex items-center text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          <HelpCircle size={18} className="mr-2" />
                          なぜやるのか
                        </h3>
                        <p className="text-gray-800 text-base leading-relaxed">
                          {task.reason || "（設定されていません）"}
                        </p>
                      </section>
                    </div>

                    {/* Tips */}
                    {task.tips && (
                      <section className="bg-amber-50 p-4 rounded-lg border border-amber-200 border-l-4 border-l-amber-400">
                        <h3 className="flex items-center text-md font-bold text-amber-800 mb-2">
                          <Lightbulb size={20} className="mr-2 text-amber-600" />
                          Tips / 経験則
                        </h3>
                        <p className="text-amber-900 text-sm leading-relaxed">{task.tips}</p>
                      </section>
                    )}

                    {/* Subtasks Table */}
                    <section>
                      <h3 className="flex items-center text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                        <Target size={20} className="mr-2 text-gray-700" />
                        サブタスク一覧
                      </h3>
                      
                      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/5">サブタスク名</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-2/5">指示・アクション</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/5">
                                <span className="flex items-center gap-1"><Box size={14}/> 成果物</span>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">
                                <span className="flex items-center gap-1"><Clock size={14}/> 時間</span>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">
                                <span className="flex items-center gap-1"><FileText size={14}/> 雛形</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {task.subtasks.map((sub, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm font-bold text-gray-900 align-top">
                                  {sub.title}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 align-top whitespace-pre-wrap">
                                  {sub.instructions}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 align-top">
                                  {sub.deliverables}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 align-top">
                                  {sub.estimated_hours}h
                                </td>
                                <td className="px-4 py-3 text-sm align-top">
                                  {sub.template_content && (
                                    <button
                                      onClick={() => setViewingTemplate({ title: sub.title, content: sub.template_content! })}
                                      className="inline-flex items-center justify-center p-1.5 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 border border-purple-200 transition-colors"
                                      title="テンプレートを表示"
                                    >
                                      <FileText size={16} />
                                      <span className="ml-1 text-xs font-medium">開く</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {task.subtasks.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400 italic">
                                  サブタスクは登録されていません
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>

                  </div>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar orientation="vertical" className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-[160ms] ease-out hover:bg-gray-200 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5">
                  <ScrollArea.Thumb className="flex-1 bg-gray-300 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            </>
          )}
          
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
