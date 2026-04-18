/**
 * parseOCRResult 解析逻辑测试
 * 用法: node test-parser.js
 */

// ========== 模拟 tableData（从 app.globalData.tableData 获取） ==========
const tableData = [
  // 血常规 (type: 1)
  { type: 1, r_i: 1, alias: ['白细胞', 'WBC', '白细胞计数'] },
  { type: 1, r_i: 2, alias: ['淋巴细胞', 'LYM', '淋巴细胞计数'] },
  { type: 1, r_i: 3, alias: ['单核细胞', 'MON', '单核细胞计数'] },
  { type: 1, r_i: 4, alias: ['中性粒细胞', 'NEUT', '中性粒细胞计数', 'NEU'] },
  { type: 1, r_i: 5, alias: ['嗜酸性粒细胞', 'EOS', '嗜酸细胞'] },
  { type: 1, r_i: 6, alias: ['嗜碱性粒细胞', 'BASO', '嗜碱细胞'] },
  { type: 1, r_i: 7, alias: ['红细胞', 'RBC', '红细胞计数'] },
  { type: 1, r_i: 8, alias: ['血红蛋白', 'HGB', 'HB'] },
  { type: 1, r_i: 9, alias: ['红细胞压积', 'HCT', '红细胞比容'] },
  { type: 1, r_i: 10, alias: ['平均红细胞体积', 'MCV'] },
  { type: 1, r_i: 11, alias: ['平均红细胞血红蛋白含量', 'MCH'] },
  { type: 1, r_i: 12, alias: ['平均红细胞血红蛋白浓度', 'MCHC'] },
  { type: 1, r_i: 13, alias: ['血小板', 'PLT', '血小板计数'] },
  { type: 1, r_i: 14, alias: ['平均血小板体积', 'MPV'] },
];

// ========== 模拟 OCR 返回数据 ==========
// 这里是你可以修改的测试数据
const ocrData = [
  { DetectedText: '某某医院检验报告单', ItemPolygon: {} },
  { DetectedText: '2024-01-15', ItemPolygon: {} },
  { DetectedText: '姓名：张三  性别：男  年龄：35岁', ItemPolygon: {} },
  { DetectedText: '白细胞 5.2', ItemPolygon: {} },              // 项目 + 值 同一行
  { DetectedText: '淋巴细胞比例 30.5%', ItemPolygon: {} },     // 项目名不同 "比例"
  { DetectedText: '单核细胞计数 0.4', ItemPolygon: {} },       // 标准格式
  { DetectedText: '中性粒细胞', ItemPolygon: {} },             // 只有项目名，没值（下一行）
  { DetectedText: '3.5', ItemPolygon: {} },                    // 值在下一行
  { DetectedText: '嗜酸性粒细胞 0.05', ItemPolygon: {} },
  { DetectedText: '嗜碱性粒细胞 0.01', ItemPolygon: {} },
  { DetectedText: '红细胞 4.85', ItemPolygon: {} },
  { DetectedText: '血红蛋白 145', ItemPolygon: {} },
  { DetectedText: '血小板 210', ItemPolygon: {} },
  { DetectedText: '参考范围：', ItemPolygon: {} },
  { DetectedText: '白细胞(4-10)  淋巴细胞(20-40)  中性粒细胞(50-70)', ItemPolygon: {} },
];

// ========== 解析函数（复制当前代码逻辑） ==========
function parseOCRResult(ocrData, tableData) {
  if (!ocrData || !Array.isArray(ocrData)) {
    throw new Error('OCR数据格式异常');
  }

  const texts = ocrData.map(item => ({
    text: item.DetectedText?.trim() || '',
    location: item.ItemPolygon || {}
  }));

  console.log('=== OCR 识别内容 ===');
  texts.forEach((t, i) => console.log(`${i + 1}: "${t.text}"`));
  console.log('');

  // 提取日期
  const dateItem = texts.find(t => /\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?/.test(t.text));
  const date = dateItem ? dateItem.text : new Date().toISOString().split('T')[0];
  console.log('提取日期:', date);
  console.log('');

  // 构建映射表
  const aliasMap = {};
  tableData.forEach(item => {
    item.alias.forEach(alias => {
      aliasMap[alias] = { type: item.type, r_i: item.r_i };
    });
  });

  const aliasKeys = Object.keys(aliasMap).sort((a, b) => b.length - a.length);
  console.log('=== 项目别名表 ===');
  console.log('别名数量:', aliasKeys.length);
  if (aliasKeys.length === 0) return null;

  const regex = new RegExp(aliasKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');

  // 匹配项目
  const typeCount = {};
  const matchedProjects = {};
  const unmatchedAliases = []; // 记录未匹配到的别名

  console.log('=== 解析过程 ===');
  texts.forEach((textItem, index) => {
    const text = textItem.text;
    const match = text.match(regex);
    if (match) {
      const matchedAlias = match[0];
      const { type, r_i } = aliasMap[matchedAlias];
      typeCount[type] = (typeCount[type] || 0) + 1;
      console.log(`✓ 行${index + 1}: 匹配到 "${matchedAlias}" type:${type} r_i:${r_i}`);

      // 提取数值
      let value = null;

      // 方式1: 项目名后面的数字
      const afterMatch = text.replace(matchedAlias, '').trim();
      const valueMatch = afterMatch.match(/^[：:]*\s*([<>]?\s*\d+(\.\d+)?)/);
      if (valueMatch) {
        value = parseFloat(valueMatch[1].replace(/\s/g, ''));
        console.log(`  → 方式1(本行): 提取 ${value} ← 原文字: "${text}"`);
      }

      // 方式2: 下一行的数字
      if (value === null && index + 1 < texts.length) {
        const nextText = texts[index + 1].text;
        const nextMatch = nextText.match(/^([<>]?\s*\d+(\.\d+)?)/);
        if (nextMatch) {
          value = parseFloat(nextMatch[1].replace(/\s/g, ''));
          console.log(`  → 方式2(下一行): 提取 ${value} ← 下一行: "${nextText}"`);
        }
      }

      // 方式3: 同行任意数字
      if (value === null) {
        const anyMatch = text.match(/([<>]?\s*\d+(\.\d+)?)/);
        if (anyMatch) {
          value = parseFloat(anyMatch[1].replace(/\s/g, ''));
          console.log(`  → 方式3(同行兜底): 提取 ${value} ← 原文字: "${text}"`);
        }
      }

      if (value !== null) {
        matchedProjects[r_i] = value;
        console.log(`  最终值: ${value}`);
      } else {
        console.log(`  ✗ 未提取到数值！`);
      }
    }
  });

  console.log('');
  console.log('=== 匹配结果 ===');
  console.log('匹配到的项目:', matchedProjects);
  console.log('类型计数:', typeCount);

  // 确定cate_id
  let cate_id = 0;
  let maxCount = 0;
  for (const [type, count] of Object.entries(typeCount)) {
    if (count > maxCount) {
      maxCount = count;
      cate_id = parseInt(type);
    }
  }
  console.log(`确定类型ID: ${cate_id} (匹配数: ${maxCount})`);

  // 过滤最终项目
  const finalProjects = {};
  tableData.forEach(item => {
    if (item.type === cate_id && matchedProjects[item.r_i] !== undefined) {
      finalProjects[item.r_i] = matchedProjects[item.r_i];
    }
  });

  console.log('');
  console.log('=== 最终结果 ===');
  console.log('最终项目:', finalProjects);

  return { date, cate_id, ...finalProjects };
}

// ========== 运行测试 ==========
console.log('========================================');
console.log('  parseOCRResult 解析逻辑测试');
console.log('========================================\n');

const result = parseOCRResult(ocrData, tableData);

console.log('\n========================================');
console.log('  测试完成');
console.log('========================================');

// 你可以在这里修改 ocrData 来测试不同的报告格式
// 也可以添加更多测试用例到下面的数组中
