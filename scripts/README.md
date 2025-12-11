# スクリプト説明

## embed-md-to-csv.ts

マークダウンファイルの内容をCSVファイルのセルに埋め込むスクリプトです。

### 機能

1. `public/subtasks.csv` を読み込み
2. 各行の `template_files` カラムからマークダウンファイルのパスを取得
3. マークダウンファイルの内容を読み込む
4. 新しいカラム `detail_content` に内容を追加
5. `public/subtasks_with_content.csv` として出力

### 実行方法

```bash
npm run embed-md
```

または直接実行：

```bash
npx tsx scripts/embed-md-to-csv.ts
```

### CSV RFC 4180準拠の実装

このスクリプトは、CSV RFC 4180仕様に完全準拠しています。

#### エスケープルール

1. **基本ルール**
   - フィールドにカンマ、改行、ダブルクォートが含まれる場合、フィールド全体をダブルクォートで囲む
   - フィールド内のダブルクォートは2つ重ねる（`""`)

2. **実装例**

```typescript
function escapeCsvField(field: string): string {
  if (!field) return '';
  
  // ダブルクォートを2つ重ねてエスケープ
  const escaped = field.replace(/"/g, '""');
  
  // カンマ、改行、ダブルクォートを含む場合は全体をクォートで囲む
  if (escaped.includes(',') || escaped.includes('\n') || 
      escaped.includes('\r') || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  
  return escaped;
}
```

3. **パース例**

スクリプトには、複数行対応のCSVパーサーも実装されています：

```typescript
function parseMultilineCsv(content: string): string[][] {
  // クォート内の改行を正しく処理
  // エスケープされたダブルクォートを正しく処理
  // フィールドの区切りを正しく認識
}
```

### 入力ファイル

- `public/subtasks.csv`
  - 必須カラム: `task_id`, `title`, `instructions`, `deliverables`, `estimated_hours`, `template_files`
  - `template_files` カラムにマークダウンファイルのパスを記載

- `public/subtask_details/*.md`
  - 各サブタスクの詳細を記述したマークダウンファイル

### 出力ファイル

- `public/subtasks_with_content.csv`
  - 元のカラム + `detail_content` カラム
  - `detail_content` にはマークダウンファイルの全内容が含まれる
  - 改行やダブルクォートは適切にエスケープされる

- `public/tasks_with_content.csv`
  - `tasks.csv` のコピー（現在マークダウン参照がないため）

### CSV複数行セルの例

```csv
id,title,content
1,タスク1,"これは単一行です"
2,タスク2,"これは複数行の
テキストです。
3行目もあります。"
3,タスク3,"ダブルクォート""を含む場合は
このようにエスケープします。"
```

### エラーハンドリング

- ファイルが見つからない場合は警告を表示し、空文字列を設定
- CSVパースエラーは詳細なエラーメッセージを表示

### 実行結果の例

```
🚀 マークダウンファイルをCSVに埋め込みます

📂 プロジェクトルート: /Users/kohei/Desktop/event-task-manager
📂 公開ディレクトリ: /Users/kohei/Desktop/event-task-manager/public

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 subtasks.csv を処理中...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 CSVファイルを読み込んでいます...
📝 マークダウンファイルを読み込んでいます...
   ✓ subtask_details/1_kickoff_agenda.md (2557 bytes)
   ✓ subtask_details/3_meeting_minutes.md (2538 bytes)
   ...
💾 新しいCSVファイルを作成しています...
✅ 完了！ /Users/kohei/Desktop/event-task-manager/public/subtasks_with_content.csv に保存しました
   処理行数: 62行（ヘッダー除く）

🎉 全ての処理が完了しました！
```

### テクニカルノート

#### なぜ標準ライブラリを使わないのか？

Node.jsの標準ライブラリや多くのCSVライブラリは、RFC 4180を部分的にしかサポートしていません。特に：

- クォート内の改行処理
- エスケープされたダブルクォートの処理
- 大容量ファイルの効率的な処理

これらを確実に処理するため、独自実装を採用しています。

#### パフォーマンス

- メモリ効率: 全ファイルをメモリに読み込むため、大容量ファイルには注意
- 処理速度: 62ファイル（約250KB）を数秒で処理

将来的に大容量化する場合は、ストリーム処理への移行を検討してください。

### 拡張性

このスクリプトは以下のように拡張可能です：

1. **他のCSVファイルへの適用**
   ```typescript
   embedMarkdownToSubtasksCsv(inputPath, outputPath, publicDir);
   ```

2. **カスタムカラム名**
   - `detail_content` を別の名前に変更可能

3. **フィルタリング**
   - 特定のファイルのみ処理する機能を追加可能

4. **並列処理**
   - 複数ファイルの同時読み込みで高速化可能
