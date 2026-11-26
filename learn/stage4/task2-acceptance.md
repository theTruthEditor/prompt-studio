# Task 2 验收卡 · 导入导出（模块 5）

> 完成顺序建议：先跑证据链（有了体感再答题），后答验收三问与费曼。
> 全部用自己的话，答不出可以说"卡在某点"。

## 一、证据链（🧑‍💻 全程亲手，六段截图/终端记录）

```bash
# 0. 登录拿票（和 Task 1 同一套：把登录响应里的 accessToken 摘出来存进 TOKEN）
TOKEN=$(curl -s -X POST http://192.168.252.2/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"[REDACTED]","password":"rehearsal123"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")
# 预期：无报错。可用 echo "${#TOKEN}" 自检，长度应为三段式 JWT 的 150+ 字符

# 1. 导出 JSON：-i = 把响应头和响应体一起打出来（这次的重点就是看头）
curl -si "http://192.168.252.2/api/prompts/export?format=json" -H "Authorization: Bearer $TOKEN"
# 预期：HTTP/1.1 200 OK 里能找到两行新头：
#   Content-Type: application/json; charset=utf-8
#   Content-Disposition: attachment; filename="prompts-2026-XX-XX.json"
# 正文是一大段 JSON 数组（你的全部提示词）

# 2. 导出 Markdown：换 format=md，看正文换了个模样
curl -si "http://192.168.252.2/api/prompts/export?format=md" -H "Authorization: Bearer $TOKEN"
# 预期：Content-Type 变 text/markdown...，正文变成 "## 1. 标题" 开头的 markdown

# 3. 手写一份「2 好数据 + 1 坏数据」的导入文件（Mac 上执行，在 prompt-studio 目录外随便哪都行）
cat > /tmp/import-test.json <<'EOF'
[
  {"title":"导入实验品A","body":"好数据一号","tags":["导入测试"]},
  {"title":"导入实验品B","body":"好数据二号","tags":["导入测试","新标签自动建"]},
  {"title":"","body":"坏数据：标题是空的"}
]
EOF
# 预期：无输出（cat > 静默成功）。可用 head /tmp/import-test.json 看一眼

# 4. 导入：-F = multipart 表单上传（和 -d 的 JSON 请求体是两码事），字段名必须是 file
curl -s -X POST http://192.168.252.2/api/prompts/import \
  -H "Authorization: Bearer $TOKEN" -F "file=@/tmp/import-test.json"
# 预期回报单：{"created":2,"skipped":0,"errors":[{"row":3,"message":"..."}]}
# 第 3 行被拒但前两行进库——这就是「部分成功语义」

# 5. 交叉验证（DBeaver）：
#    prompts 表多了"导入实验品A/B"两行；
#    tags 表自动冒出"导入测试""新标签自动建"（connectOrCreate：有就复用、没有就建）

# 6. 越权回归（老规矩）：
#    a. 不带 Authorization 头调 export → 401
#    b. 注册第二账号，用它的 token 调 export → 只导出它自己的（空列表 []），看不到你的任何数据
```

- [ ] 段1：export?format=json 响应头里有 Content-Disposition 附件头 + JSON 正文
- [ ] 段2：export?format=md 正文是 markdown 形态
- [ ] 段3：import 回报单 created=2 且 errors 里指着第 3 行
- [ ] 段4：DBeaver 见证 prompts +2 行、tags 自动建标签
- [ ] 段5：无 token → 401；他人 token → 看不见你的数据
- [ ] 段6（可选加分）：把段1导出的原文再 import 回去 → created=N 全成功——
      想一想：这会带来什么副作用？（答案往"v1 不去重"上想）

## 二、验收三问

**Q1**：export 为什么用 `@Res({ passthrough: true })` 手动 setHeader，而不是像其他接口那样直接 return 数据？如果把 `Content-Disposition` 那行拿掉，浏览器/curl 那头会发生什么变化？

（你的答案）

**Q2**：import 遇到坏行选择"跳过它、继续导好行"，而不是整批回滚。这是什么业务判断？换什么样的业务必须反过来——一行坏就要整批回滚（事务）？各举一个生活化的例子。

（你的答案）

**Q3**：这次 import 的请求是 `multipart/form-data`，而 create/update 都是 `application/json`。这两者差在哪？为什么文件上传必须用前者、不能把文件内容塞进 JSON 里？

（你的答案）

## 三、费曼两题

**费曼 1**：一条 export 请求从进 controller 到你终端拿到文件，service 返回的 `content / filename / contentType` 三样东西各走什么通道到浏览器？（提示：两个走响应头，一个走响应体；说清每样落在哪）

（你的答案）

**费曼 2**：为什么 md 格式"只导出、不导入"，json 却能进也能出？从"信息有没有丢"的角度讲。

（你的答案）

---

## 交卷方式

答案直接写进本文件（每题"（你的答案）"下方），写完说"交卷了"。
