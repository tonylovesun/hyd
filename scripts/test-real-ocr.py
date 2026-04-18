import requests
import json
import base64

# 读取图片
with open(r'G:\miniprogram\hyd\scripts\test-base64.txt', 'r', encoding='utf-8') as f:
    b64 = f.read()

print(f"发送图片大小: {len(b64)} 字符")

# 调用 OCR API
url = 'https://jyj.lboxshop.cc/ocr'
data = {'imageBase64': b64}

try:
    resp = requests.post(url, json=data, timeout=60)
    print(f"状态码: {resp.status_code}")
    result = resp.json()
    print(f"返回结果: {json.dumps(result, ensure_ascii=False)[:500]}")
    
    if result.get('code') == 0:
        items = result.get('result', [])
        print(f"\n识别成功! 共 {len(items)} 个文本块")
        for i, item in enumerate(items[:10]):
            print(f"  {i+1}. {item.get('DetectedText', '')[:50]}")
    else:
        print(f"识别失败: {result.get('message')}")
except Exception as e:
    print(f"请求失败: {e}")
