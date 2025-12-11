import * as fs from 'fs';
import * as path from 'path';

/**
 * CSV RFC 4180に従ってフィールドをエスケープする
 * - ダブルクォート、カンマ、改行を含む場合は全体をダブルクォートで囲む
 * - フィールド内のダブルクォートは2つ重ねる
 */
function escapeCsvField(field: string): string {
  if (!field) return '';
  
  // ダブルクォートを2つ重ねてエスケープ
  const escaped = field.replace(/"/g, '""');
  
  // ダブルクォート、カンマ、改行、キャリッジリターンを含む場合は全体をクォートで囲む
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r') || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  
  return escaped;
}

/**
 * CSVの行をパースする（シンプルな実装）
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // エスケープされたダブルクォート
        currentField += '"';
        i++; // 次の文字をスキップ
      } else {
        // クォートの開始または終了
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // フィールドの区切り
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // 最後のフィールドを追加
  fields.push(currentField);
  
  return fields;
}

/**
 * 複数行対応のCSVパーサー
 */
function parseMultilineCsv(content: string): string[][] {
  const rows: string[][] = [];
  const lines = content.split('\n');
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  let lineBuffer = '';
  
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    lineBuffer += (lineBuffer ? '\n' : '') + line;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // 行末の処理
    if (!insideQuotes) {
      currentRow.push(currentField);
      if (currentRow.length > 0 && currentRow.some(f => f !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
      lineBuffer = '';
    } else {
      // クォート内の改行
      currentField += '\n';
    }
  }
  
  return rows;
}

/**
 * マークダウンファイルの内容を読み込む
 */
function readMarkdownContent(filePath: string, baseDir: string): string {
  try {
    const fullPath = path.join(baseDir, filePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  ファイルが見つかりません: ${fullPath}`);
      return '';
    }
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    console.error(`❌ ファイル読み込みエラー: ${filePath}`, error);
    return '';
  }
}

/**
 * subtasks.csvにマークダウンの内容を埋め込む
 */
function embedMarkdownToSubtasksCsv(
  inputCsvPath: string,
  outputCsvPath: string,
  publicDir: string
): void {
  console.log('📖 CSVファイルを読み込んでいます...');
  const csvContent = fs.readFileSync(inputCsvPath, 'utf-8');
  const rows = parseMultilineCsv(csvContent);
  
  if (rows.length === 0) {
    console.error('❌ CSVファイルが空です');
    return;
  }
  
  // ヘッダー行を取得
  const headers = rows[0];
  const templateFilesIndex = headers.indexOf('template_files');
  
  if (templateFilesIndex === -1) {
    console.error('❌ template_filesカラムが見つかりません');
    return;
  }
  
  // 新しいヘッダーを追加
  const newHeaders = [...headers, 'detail_content'];
  const outputRows: string[][] = [newHeaders];
  
  console.log('📝 マークダウンファイルを読み込んでいます...');
  
  // データ行を処理
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const templateFile = row[templateFilesIndex];
    
    let markdownContent = '';
    if (templateFile && templateFile.trim() !== '') {
      markdownContent = readMarkdownContent(templateFile, publicDir);
      console.log(`   ✓ ${templateFile} (${markdownContent.length} bytes)`);
    }
    
    const newRow = [...row, markdownContent];
    outputRows.push(newRow);
  }
  
  // CSVとして出力
  console.log('💾 新しいCSVファイルを作成しています...');
  const outputLines = outputRows.map(row => 
    row.map(field => escapeCsvField(field)).join(',')
  );
  const outputContent = outputLines.join('\n');
  
  fs.writeFileSync(outputCsvPath, outputContent, 'utf-8');
  console.log(`✅ 完了！ ${outputCsvPath} に保存しました`);
  console.log(`   処理行数: ${rows.length - 1}行（ヘッダー除く）`);
}

// メイン処理
function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const publicDir = path.join(projectRoot, 'public');
  const inputSubtasksCsv = path.join(publicDir, 'subtasks.csv');
  const outputSubtasksCsv = path.join(publicDir, 'subtasks_with_content.csv');
  
  console.log('🚀 マークダウンファイルをCSVに埋め込みます\n');
  console.log(`📂 プロジェクトルート: ${projectRoot}`);
  console.log(`📂 公開ディレクトリ: ${publicDir}\n`);
  
  // subtasks.csvを処理
  if (fs.existsSync(inputSubtasksCsv)) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 subtasks.csv を処理中...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    embedMarkdownToSubtasksCsv(inputSubtasksCsv, outputSubtasksCsv, publicDir);
    console.log('');
  } else {
    console.error(`❌ ${inputSubtasksCsv} が見つかりません\n`);
  }
  
  console.log('🎉 全ての処理が完了しました！');
}

// スクリプト実行
main();
