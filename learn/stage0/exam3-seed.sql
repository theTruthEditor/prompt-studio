-- 第三卷考试库种子数据（prompt_studio_exam，v3）
INSERT INTO users (email, nickname) VALUES
  ('nina@dev.com',  'Nina'),
  ('oscar@dev.com', 'Oscar'),
  ('paula@dev.com', 'Paula'),
  ('quinn@dev.com', 'Quinn'),
  ('rosa@dev.com',  'Rosa');

INSERT INTO tags (name) VALUES
  ('健康'), ('旅行'), ('职场'), ('创作');

INSERT INTO prompts (id, user_id, title, body, is_favorite, created_at) VALUES
  (1,  1, '晨间习惯',     '设计可持续的晨间流程',     TRUE,  now() - interval '11 days'),
  (2,  1, '年度目标',     '拆解年度目标为季度计划',   FALSE, now() - interval '10 days'),
  (3,  1, '体检报告解读', '通俗解读体检指标',         FALSE, now() - interval '9 days'),
  (4,  1, '公众号选题',   '生成差异化选题清单',       FALSE, now() - interval '8 days'),
  (5,  2, '谈判技巧',     '模拟薪资谈判对话',         TRUE,  now() - interval '7 days'),
  (6,  2, '面试复盘',     '结构化复盘面试表现',       FALSE, now() - interval '6 days'),
  (7,  3, '瑜伽序列',     '按时长生成瑜伽序列',       TRUE,  now() - interval '5 days'),
  (8,  3, '减脂餐计划',   '按口味生成一周减脂餐',     FALSE, now() - interval '4 days'),
  (9,  3, '朋友圈文案',   '把日常写成朋友圈文案',     FALSE, now() - interval '3 days'),
  (10, 3, '睡眠改善',     '分析并改善睡眠习惯',       FALSE, now() - interval '2 days'),
  (11, 4, '旅行药包清单', '按目的地生成药包清单',     TRUE,  now() - interval '1 day'),
  (12, 4, '手帐排版',     '生成手帐版式建议',         FALSE, now());

INSERT INTO prompt_tags (prompt_id, tag_id) VALUES
  (1, 1), (1, 4),
  (2, 3),
  (3, 1), (3, 3),
  (4, 4),
  (5, 3),
  (6, 3),
  (7, 1),
  (9, 4),
  (10, 1),
  (11, 1),
  (12, 4);
