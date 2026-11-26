# Task 1 验收卡 · 版本历史（模块 3）

> 完成顺序建议：先跑证据链（有了体感再答题），后答验收三问与费曼。
> 全部用自己的话，答不出可以说"卡在某点"。

## 一、证据链（🧑‍💻 全程亲手，五段截图/终端记录）

```bash
# 0. 登录拿票（VM 栈的现成账号）
TOKEN=$(curl -s -X POST http://192.168.252.2/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rehearsal@test.com","password":"rehearsal123"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

# 1. 建实验品（记下返回的 id）
curl -s -X POST http://192.168.252.2/api/prompts \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"版本历史实验品","body":"第一版正文"}'

# 2. 改错：body 改成第二版
curl -s -X PATCH http://192.168.252.2/api/prompts/<id> \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"body":"第二版（改错了）"}'

# 3. 看历史：应出现一条 source=edit 的快照，body=第一版正文
curl -s http://192.168.252.2/api/prompts/<id>/snapshots -H "Authorization: Bearer $TOKEN"

# 4. 回滚：restore 那条快照（记下快照 id）
curl -s -X POST http://192.168.252.2/api/prompts/<id>/snapshots/<snapshotId>/restore \
  -H "Authorization: Bearer $TOKEN"

# 5. 确认两件事：GET /:id 的 body 回到第一版；GET snapshots 多了一条 source=restore 的快照（内容=第二版）
# 6. 可逆性实证：再 restore 那条 restore 快照 → 又回到第二版（回滚的回滚）
# 7. 空操作被拒：对与当前内容相同的快照再 restore 一次 → 400
```

- [ ✅ ] 段1：改错后 GET /:id 显示第二版
- [ ✅ ] 段2：snapshots 列表出现 source=edit 快照（第一版正文）
- [ ✅ ] 段3：restore 后 body 回到第一版
- [ ✅ ] 段4：列表新增 source=restore 快照 + 再次 restore 成功回到第二版（**可逆性**）
- [ ✅ ] 段5：对相同内容快照 restore → **400**

## 二、越权加测（🧑‍💻，防水平越权老规矩的回归）

- [ ✅ ]注册第二个账号 → 用**它的 token** 对第一账号提示词的快照 restore → 应 **404**
- [ ] 一句话：为什么是 404 不是 403？（答题区）
因为直接提示404，这样不会让用户知道数据库是否存在该数据，避免泄露数据，若直接提示403，则代表用户越权了，间接说明这条数据是别人的。

## 三、验收三问

**Q1**：update 的快照钩子为什么是 `dto.body !== undefined && dto.body !== prompt.body` 两个条件？去掉第二个会怎样？去掉第一个呢？
  
（你的答案） 第一个条件：假设要更改的数据body为空，不抛出异常，那就会直接存一个空数据到库里面；
           第二个条件：是为了比较要替换的body和原库里存的数据是否一致，假设一致，可以直接不用存日志，避免无效数据；

**Q2**：restore 为什么在回滚前先把「当前内容」存成 source=restore 的快照？没有这一步，用户的后悔药会失去什么能力？

（你的答案）存成 source=restore 的快照相当于给更改前的数据都做了一份备份数据，这样方便以后可以撤回修改。没有这一步，就没有存改之前的数据，那么就不可能将数据找回。

**Q3**：对"快照内容与当前相同"的 restore 回 400 而不是 200——这延续了项目里哪条老规矩？它在哪两个旧场景出现过？

（你的答案）快照内容和当前一模一样 = 回滚是空操作 → 400 拒绝「撒谎的成功」
     同 update 的空补丁 400：不让接口返回一个什么都没改的 200
     A. 阶段 1 重复绑定标签回 409　是“接口按真实发生的事说话”家族，因为该情况不会出现数据报错或者改变的情况，并且没有响应内容。

## 四、费曼两题

**费曼 1**：全量快照 vs diff 快照，v1 为什么选全量？从「恢复的可靠性」和「实现成本」两头说。

（你的答案） 选全量的话，直接覆盖，实现成本低，恢复时一行 update 搞定；
           选diff的话，需要去每个字段都比较，做不同的处理，实现成本高，但是这样就会有比较详细的操作日志，方便后续排查。

**费曼 2**：一条 PATCH 请求进来，数据在 prompt_snapshots 和 prompts 两张表之间怎么流动？GET /:id/snapshots 又是从哪张表读什么？

（你的答案）一条 PATCH 请求进来之后，数据先比较哪些不同，然后在prompt_snapshots表现插入一条操作日志，然后prompts表中进行相应的字段替换，GET /:id/snapshots，这个是在prompt_snapshots这个表里面进行筛选prompt_id为传过来的值的响应数据。
。