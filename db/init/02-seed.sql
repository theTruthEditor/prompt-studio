INSERT INTO users (email, nickname) VALUES
  ('alice@dev.com', 'Alice'),
  ('bob@dev.com',   'Bob'),
  ('carol@dev.com', 'Carol'),
  ('dave@dev.com',  'Dave');

INSERT INTO tags (name) VALUES
  ('写作'), ('编程'), ('翻译'), ('头条'), ('面试'), ('育儿');

INSERT INTO prompts (id, user_id, title, body, is_favorite, created_at) VALUES
  (1,  1, '周报生成器',   '把本周工作列表整理成结构化周报', TRUE,  now() - interval '10 days'),
  (2,  1, 'SQL 优化顾问', '分析慢查询并给出优化建议',       TRUE,  now() - interval '9 days'),
  (3,  1, '英文润色',     '把中文润色为地道英文',           FALSE, now() - interval '8 days'),
  (4,  1, '小红书标题',   '生成吸睛的小红书标题',           FALSE, now() - interval '7 days'),
  (5,  2, '代码审查助手', '按团队规范审查代码',             TRUE,  now() - interval '6 days'),
  (6,  2, '单元测试生成', '为函数生成单测',                 FALSE, now() - interval '5 days'),
  (7,  2, '面试模拟官',   '模拟全栈岗位技术面试',           FALSE, now() - interval '4 days'),
  (8,  2, 'Git 提交信息', '按约定式提交生成 commit message', FALSE, now() - interval '3 days'),
  (9,  3, '育儿故事',     '给 4 岁孩子编睡前故事',          FALSE, now() - interval '2 days'),
  (10, 3, '菜谱改编',     '把家常菜谱改成减脂版',           TRUE,  now() - interval '1 day'),
  (11, 3, '旅行计划',     '按预算生成行程',                 FALSE, now());

INSERT INTO prompt_tags (prompt_id, tag_id) VALUES
  (1, 1), (1, 4),
  (2, 2), (2, 5),
  (3, 3), (3, 1),
  (4, 4), (4, 1),
  (5, 2),
  (6, 2), (6, 5),
  (7, 5),
  (8, 2),
  (9, 1),
  (11, 3);
