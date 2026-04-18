/**
 * 尿常规报告 OCR 解析测试
 * 基于坐标信息重建表格结构
 */

// OCR 识别结果
const ocrData = [
  { text: "X", x: 197, y: 39 },
  { text: "报告在线预览", x: 1132, y: 21 },
  { text: "...", x: 2282, y: 54 },
  { text: "shczdoc.shczyy.con", x: 1108, y: 67 },
  { text: "姓名:杨学", x: 91, y: 88 },
  { text: "代号", x: 453, y: 112 },
  { text: "项", x: 578, y: 115 },
  { text: "结", x: 879, y: 112 },
  { text: "果", x: 955, y: 112 },
  { text: "参考值", x: 1132, y: 115 },
  { text: "项", x: 1570, y: 115 },
  { text: "结", x: 1874, y: 112 },
  { text: "果", x: 1944, y: 112 },
  { text: "参", x: 2139, y: 109 },
  { text: "1/作别:男", x: 64, y: 163 },
  { text: "尿色", x: 538, y: 173 },
  { text: "淡黄", x: 940, y: 173 },
  { text: "鳞状上皮细胞", x: 1503, y: 170 },
  { text: "未查见", x: 1883, y: 170 },
  { text: "0-25/u]", x: 2063, y: 173 },
  { text: "下载报告", x: 2276, y: 152 },
  { text: "年龄:42岁", x: 88, y: 222 },
  { text: "尿清晰度", x: 541, y: 225 },
  { text: "清晰", x: 937, y: 225 },
  { text: "手工尿蛋白质", x: 1509, y: 222 },
  { text: "2+↑", x: 1953, y: 225 },
  { text: "阴性", x: 2066, y: 222 },
  { text: "病历号:H05980718", x: 85, y: 270 },
  { text: "尿比重", x: 541, y: 276 },
  { text: "1.015", x: 922, y: 279 },
  { text: "1.003-1.030", x: 1080, y: 276 },
  { text: "手工尿葡萄糖", x: 1509, y: 276 },
  { text: "阴性", x: 1920, y: 276 },
  { text: "阴性", x: 2063, y: 276 },
  { text: "科室:肾移植门诊", x: 85, y: 328 },
  { text: "尿PH值", x: 541, y: 331 },
  { text: "6,50", x: 937, y: 334 },
  { text: "4.5--8.0", x: 1077, y: 334 },
  { text: "粘液丝", x: 1506, y: 331 },
  { text: "/HP", x: 2066, y: 334 },
  { text: "床号:", x: 85, y: 377 },
  { text: "亚硝酸盐", x: 541, y: 386 },
  { text: "阴性", x: 940, y: 386 },
  { text: "阴性", x: 1080, y: 383 },
  { text: "病人类型:门诊", x: 85, y: 435 },
  { text: "尿胆红素", x: 541, y: 441 },
  { text: "阴性", x: 940, y: 438 },
  { text: "阴性", x: 1080, y: 435 },
  { text: "标本类型:尿", x: 84, y: 497 },
  { text: "尿胆原", x: 541, y: 493 },
  { text: "正常", x: 943, y: 493 },
  { text: "正常", x: 1080, y: 489 },
  { text: "采样时间:", x: 88, y: 550 },
  { text: "尿蛋白质", x: 541, y: 544 },
  { text: "2+↑", x: 973, y: 547 },
  { text: "阴性", x: 1080, y: 541 },
  { text: "2026-04-14", x: 85, y: 596 },
  { text: "尿葡萄糖", x: 538, y: 599 },
  { text: "阴性", x: 940, y: 599 },
  { text: "阴性", x: 1080, y: 596 },
  { text: "07:50:49", x: 85, y: 648 },
  { text: "尿酮体", x: 541, y: 651 },
  { text: "阴性", x: 940, y: 651 },
  { text: "阴性", x: 1080, y: 648 },
  { text: "临床诊断:", x: 85, y: 696 },
  { text: "白细胞酯酶", x: 541, y: 706 },
  { text: "阴性", x: 940, y: 709 },
  { text: "阴性", x: 1080, y: 706 },
  { text: "异体肾移植状", x: 88, y: 748 },
  { text: "尿潜血", x: 541, y: 760 },
  { text: "+-1", x: 976, y: 763 },
  { text: "阴性", x: 1080, y: 760 },
  { text: "态", x: 88, y: 797 },
  { text: "尿白细胞计数", x: 544, y: 812 },
  { text: "5.0", x: 955, y: 815 },
  { text: "0-25/ul", x: 1077, y: 815 },
  { text: "备注:", x: 88, y: 855 },
  { text: "尿红细胞计数", x: 544, y: 867 },
  { text: "6.0", x: 955, y: 870 },
  { text: "0-25/ul", x: 1077, y: 867 },
];

// ========== 解析逻辑 ==========

console.log("========================================");
console.log("  尿常规报告 OCR 解析测试");
console.log("========================================\n");

// 1. 按 Y 坐标分行
console.log("=== 步骤1: 按 Y 坐标分行 ===");
const rows = {};
ocrData.forEach(item => {
  const yKey = Math.round(item.y / 10) * 10; // 按10像素近似行
  if (!rows[yKey]) rows[yKey] = [];
  rows[yKey].push(item);
});

// 按 Y 排序
const sortedRows = Object.keys(rows).sort((a, b) => parseInt(a) - parseInt(b)).map(key => rows[key]);

// 打印前20行
sortedRows.slice(0, 25).forEach((row, i) => {
  // 按 X 排序
  const sorted = row.sort((a, b) => a.x - b.x);
  const combined = sorted.map(t => t.text).join("");
  console.log(`行${i + 1} (Y≈${Object.keys(rows).sort((a, b) => parseInt(a) - parseInt(b))[i]}): ${combined}`);
});

console.log("\n=== 步骤2: 提取尿常规项目 ===");

// 尿常规项目别名映射
const urineAliases = [
  { alias: ['尿色'], r_i: 1, result: null },
  { alias: ['尿清晰度', '透明度'], r_i: 2, result: null },
  { alias: ['尿比重'], r_i: 3, result: null },
  { alias: ['尿PH值', 'PH值', 'pH值'], r_i: 4, result: null },
  { alias: ['亚硝酸盐'], r_i: 5, result: null },
  { alias: ['尿胆红素'], r_i: 6, result: null },
  { alias: ['尿胆原'], r_i: 7, result: null },
  { alias: ['尿蛋白质'], r_i: 8, result: null },
  { alias: ['尿葡萄糖'], r_i: 9, result: null },
  { alias: ['尿酮体'], r_i: 10, result: null },
  { alias: ['白细胞酯酶'], r_i: 11, result: null },
  { alias: ['尿潜血'], r_i: 12, result: null },
  { alias: ['尿白细胞计数'], r_i: 13, result: null },
  { alias: ['尿红细胞计数'], r_i: 14, result: null },
  { alias: ['鳞状上皮细胞'], r_i: 15, result: null },
  { alias: ['粘液丝'], r_i: 16, result: null },
];

// 解析每行
const parsedResults = {};
sortedRows.forEach((row, rowIndex) => {
  const sorted = row.sort((a, b) => a.x - b.x);
  const combined = sorted.map(t => t.text).join("");
  
  // 检查是否是尿常规项目
  for (const item of urineAliases) {
    for (const alias of item.alias) {
      if (combined.includes(alias)) {
        // 找到了项目，在同行找结果（通常是项目后面的文字）
        const x = row.find(t => t.text === alias)?.x || 0;
        const nearby = row.filter(t => t.x > x + 50).map(t => t.text).join("");
        
        // 提取数值或文字结果
        let result = null;
        
        // 数值提取
        const numMatch = nearby.match(/(\d+\.?\d*)/);
        if (numMatch) {
          result = numMatch[1];
        } else if (nearby.includes("阴性") || nearby.includes("正常")) {
          result = "阴性";
        } else if (nearby.includes("淡黄") || nearby.includes("清晰")) {
          result = nearby;
        } else if (nearby.trim()) {
          result = nearby.trim();
        }
        
        if (result) {
          console.log(`✓ 行${rowIndex + 1}: ${alias} → ${result}`);
          parsedResults[item.r_i] = result;
        }
        break;
      }
    }
  }
});

console.log("\n=== 解析结果 ===");
console.log("项目解析结果:", parsedResults);

console.log("\n========================================");
console.log("  问题分析");
console.log("========================================");
console.log("1. 当前代码按整行匹配，但 OCR 是按单元格识别的");
console.log("2. 同一个项目名和结果可能在同一 Y 行但 X 坐标不同");
console.log("3. 需要利用坐标信息按列匹配");
