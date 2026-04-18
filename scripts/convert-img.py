import base64

with open(r'C:\Users\ADMINI~1\AppData\Local\Temp\1\workbuddy-weixin-media\inbound\weixin-img-a7608185b84fc82f.jpg', 'rb') as f:
    img_data = f.read()

b64 = base64.b64encode(img_data).decode('utf-8')

with open(r'G:\miniprogram\hyd\scripts\test-base64.txt', 'w', encoding='utf-8') as f:
    f.write(b64)

print(f'Base64 length: {len(b64)}')
