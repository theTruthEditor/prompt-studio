-- 重考专用种子数据（prompt_studio_exam）
INSERT INTO users (email, nickname) VALUES
  ('emma@dev.com',  'Emma'),
  ('frank@dev.com', 'Frank'),
  ('grace@dev.com', 'Grace'),
  ('heidi@dev.com', 'Heidi'),
  ('ivan@dev.com',  'Ivan');

INSERT INTO tags (name) VALUES
  ('效率'), ('编程'), ('生活'), ('面试'), ('写作');

INSERT INTO prompts (id, user_id, title, body, is_favorite, created_at) VALUES
  (1,  1, '效率工具清单',   '整理常用效率工具与用法',       TRUE,  now() - interval '9 days'),
  (2,  1, '代码重构助手',   '按重构手法审查代码',           FALSE, now() - interval '8 days'),
  (3,  1, '周计划生成器',   '按目标生成一周计划',           FALSE, now() - interval '7 days'),
  (4,  1, '播客文案',       '把要点改写成播客口播稿',       FALSE, now() - interval '6 days'),
  (5,  2, '算法题讲解',     '按面试视角讲解算法题',         TRUE,  now() - interval '5 days'),
  (6,  2, '简历优化',       '按岗位 JD 优化简历',           FALSE, now() - interval '4 days'),
  (7,  2, '邮件回复',       '按语气生成英文邮件回复',       FALSE, now() - interval '3 days'),
  (8,  3, '旅行清单',       '按目的地生成装备清单',         TRUE,  now() - interval '2 days'),
  (9,  4, '读书笔记',       '把书摘整理成结构化笔记',       FALSE, now() - interval '1 day'),
  (10, 4, '睡前故事',       '给孩子编睡前小故事',           FALSE, now());

INSERT INTO prompt_tags (prompt_id, tag_id) VALUES
  (1, 1), (1, 5),
  (2, 2),
  (3, 1),
  (4, 5),
  (5, 2), (5, 4),
  (6, 4),
  (7, 5),
  (9, 1), (9, 5),
  (10, 5);
