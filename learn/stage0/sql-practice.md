# SQL 补救练习 · R1-R5 答题卡

> 练习库：`prompt_studio`（alice / bob / carol / dave）
> 进入方式：`docker exec -it prompt-studio-db psql -U postgres -d prompt_studio`
> 规则：每题在 psql 跑通、结果与期望一致后，把 SQL 和实际输出誊到对应题号下
> 卡住 20 分钟：带着你的尝试和报错找 AI 要提示（只给提示，不给答案）

## R1　每个用户的提示词总数（只要发过提示词的用户）

期望：3 行 —— Alice 4、Bob 4、Carol 3
考点：基础分组——"每 X 一行"，GROUP BY 该写谁

```select u.nickname, count(p.id) as prompt_cnt from users u
   join prompts p on p.user_id = u.id
   group by u.id
   order by prompt_cnt desc;
```

实际输出：

``` 
nickname|prompt_cnt|
--------+----------+
Bob     |         4|
Alice   |         4|
Carol   |         3|

```

## R2　每个标签的提示词数量（数量为 0 的也要出现）

期望：6 行 —— 写作 4、编程 4、面试 3、翻译 2、头条 2、育儿 0
考点：想让"没有数据的组"也出现，join 类型和计数函数各怎么选

```select t.name, count(pt.prompt_id) as prompt_cnt from tags t
   left join prompt_tags pt on pt.tag_id = t.id
   group by t.id
   order by prompt_cnt desc;
```

实际输出：

```
name|prompt_cnt|
----+----------+
编程  |         4|
写作  |         4|
面试  |         3|
头条  |         2|
翻译  |         2|
育儿  |         0|

```

## R3　找出没有打任何标签的提示词标题

期望：1 行 —— 菜谱改编
考点：反连接第一形态（prompts 视角，E9 的坑）

```select p.title from prompts p
   left join prompt_tags pt on pt.prompt_id = p.id
   where pt.tag_id is null
   group by p.id
```

实际输出：

```
title|
-----+
菜谱改编 |

```

## R4　用 NOT EXISTS 找出没有发过提示词的用户

期望：1 行 —— Dave
考点：反连接第二形态——题干指定武器，不能用 LEFT JOIN + IS NULL 交卷

```select u.nickname from users u
   where not exists (select 1 from prompts p where p.user_id = u.id)
```

实际输出：

```
nickname|
--------+
Dave    |

```

## R5　提示词数 ≥ 3 的用户昵称和数量

期望：2 行 —— Alice 4、Bob 4
考点：HAVING 组级过滤——"组"是先聚合出来的，过滤组用 HAVING 不是 WHERE

```select u.nickname, count(p.id) as prompt_cnt from users u
   join prompts p on p.user_id = u.id
   group by u.id
   having count(p.id) >= 3
   order by prompt_cnt desc;
```

实际输出：

```
nickname|prompt_cnt|
--------+----------+
Bob     |         4|
Alice   |         4|
Carol   |         3|

```

---

## 自查清单（交卷前过一遍）

- [ ] 每题 GROUP BY 写的是"每 X 一行"的那个 X（及它的 id）
- [ ] 数量会因无匹配行受影响的题，用的是 count(对方.列) 而不是 count(*)
- [ ] "没有 X 的 Y"类题：LEFT JOIN + IS NULL 或 NOT EXISTS，没误用 inner join
- [ ] 子句顺序：FROM → JOIN → WHERE → GROUP BY → HAVING → ORDER BY
- [ ] 每题实际输出与期望一致
