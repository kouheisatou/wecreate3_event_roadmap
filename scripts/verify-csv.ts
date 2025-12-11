import * as fs from 'fs';
import * as path from 'path';

/**
 * 生成されたCSVファイルが正しくパースできるか検証するスクリプト
 */

/**
 * 複数行対応のCSVパーサー（簡易版）
 */
function parseMultilineCsv(content: string): string[][] {
  const rows: string[][] = [];
  const lines = content.split('\n');
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    
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
    } else {
      // クォート内の改行
      currentField += '\n';
    }
  }
  
  return rows;
}

/**
 * CSVファイルを検証
 */
function verifyCsv(filePath: string): void {
  console.log(`\n🔍 検証中: ${path.basename(filePath)}`);
  console.log('━'.repeat(60));
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ファイルが見つかりません: ${filePath}`);
    return;
  }
  
  const fileSize = fs.statSync(filePath).size;
  console.log(`📊 ファイルサイズ: ${(fileSize / 1024).toFixed(2)} KB`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseMultilineCsv(content);
  
  if (rows.length === 0) {
    console.error('❌ CSVが空です');
    return;
  }
  
  const headers = rows[0];
  console.log(`📋 カラム数: ${headers.length}`);
  console.log(`📋 カラム名: ${headers.join(', ')}`);
  console.log(`📊 データ行数: ${rows.length - 1}行`);
  
  // detail_contentカラムの検証
  const detailContentIndex = headers.indexOf('detail_content');
  if (detailContentIndex === -1) {
    console.warn('⚠️  detail_contentカラムが見つかりません');
  } else {
    console.log(`\n✅ detail_contentカラムが存在します（インデックス: ${detailContentIndex}）`);
    
    // サンプルを確認
    const sampleCount = Math.min(5, rows.length - 1);
    console.log(`\n📝 サンプル確認（最初の${sampleCount}行）:`);
    
    for (let i = 1; i <= sampleCount; i++) {
      const row = rows[i];
      const title = row[1] || '(no title)';
      const detailContent = row[detailContentIndex] || '';
      const contentPreview = detailContent.substring(0, 50).replace(/\n/g, '\\n');
      const lineCount = (detailContent.match(/\n/g) || []).length + 1;
      
      console.log(`\n   ${i}. ${title}`);
      console.log(`      - 内容サイズ: ${detailContent.length} bytes`);
      console.log(`      - 行数: ${lineCount}行`);
      console.log(`      - プレビュー: ${contentPreview}...`);
      
      // マークダウンの構造を確認
      const hasHeadings = /^#+\s/m.test(detailContent);
      const hasCodeBlocks = /```/m.test(detailContent);
      console.log(`      - 見出し: ${hasHeadings ? '✓' : '✗'}`);
      console.log(`      - コードブロック: ${hasCodeBlocks ? '✓' : '✗'}`);
    }
  }
  
  // データ整合性チェック
  console.log(`\n🔍 データ整合性チェック:`);
  let allColumnsMatch = true;
  const expectedColumnCount = headers.length;
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length !== expectedColumnCount) {
      console.error(`   ❌ 行${i}のカラム数が不一致: ${rows[i].length} (期待値: ${expectedColumnCount})`);
      allColumnsMatch = false;
    }
  }
  
  if (allColumnsMatch) {
    console.log(`   ✅ 全ての行のカラム数が一致しています`);
  }
  
  console.log(`\n✅ 検証完了\n`);
}

// メイン処理
function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const publicDir = path.join(projectRoot, 'public');
  
  console.log('🔍 CSV検証ツール');
  console.log('━'.repeat(60));
  console.log(`📂 公開ディレクトリ: ${publicDir}`);
  
  const files = [
    path.join(publicDir, 'subtasks_with_content.csv'),
    path.join(publicDir, 'tasks_with_content.csv'),
  ];
  
  for (const file of files) {
    try {
      verifyCsv(file);
    } catch (error) {
      console.error(`❌ エラー: ${error}`);
    }
  }
  
  console.log('🎉 全ての検証が完了しました！');
}

main();
