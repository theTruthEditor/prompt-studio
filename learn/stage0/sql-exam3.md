# SQL 出师考核 · 第三卷 答题卡

> 考场：`prompt_studio_exam3`（Nina / Oscar / Paula / Quinn / Rosa）
> 进入：`docker exec -it prompt-studio-db psql -U postgres -d prompt_studio_exam3`
> 规则：90 分钟 · 关 AI · 不看任何资料 · 提前交卷可以
> 每题先在 psql 跑通，再把 SQL 和实际输出誊到对应题号下
> 开始时间：__2026-10-28 15:35__　完成时间：____

## E1 每个用户的昵称和提示词总数
```select u.nickname,count(p.id) as prompt_cnt from users u
   join prompts p on p.user_id = u.id
   group by u.id
   order by prompt_cnt desc;
```
实际输出：

```
nickname|prompt_cnt|
--------+----------+
Paula   |         4|
Nina    |         4|
Quinn   |         2|
Oscar   |         2|

```

## E2 所有用户的昵称和提示词总数，没有提示词的用户显示 0
```select u.nickname,count(p.id) as prompt_cnt from users u
   left join prompts p on p.user_id = u.id
   group by u.id
   order by prompt_cnt desc;
```
实际输出：

```
nickname|prompt_cnt|
--------+----------+
Paula   |         4|
Nina    |         4|
Quinn   |         2|
Oscar   |         2|
Rosa    |         0|

```

## E3 没有任何提示词的用户昵称
```select u.nickname from users u
   left join prompts p on p.user_id = u.id
   where p.id is null
   group by u.id
```
实际输出：

```
nickname|
--------+
Rosa    |

```

## E4 每条提示词的标题、作者 email、标签个数
```select p.title,u.nickname,u.email,count(pt.tag_id) from prompts p
   left join users u on p.user_id = u.id
   left join prompt_tags pt on pt.prompt_id = p.id
   group by u.id,p.id
```
实际输出：

```
title |nickname|email        |count|
------+--------+-------------+-----+
晨间习惯  |Nina    |nina@dev.com |    2|
睡眠改善  |Paula   |paula@dev.com|    1|
谈判技巧  |Oscar   |oscar@dev.com|    1|
公众号选题 |Nina    |nina@dev.com |    1|
体检报告解读|Nina    |nina@dev.com |    2|
手帐排版  |Quinn   |quinn@dev.com|    1|
面试复盘  |Oscar   |oscar@dev.com|    1|
旅行药包清单|Quinn   |quinn@dev.com|    1|
瑜伽序列  |Paula   |paula@dev.com|    1|
朋友圈文案 |Paula   |paula@dev.com|    1|
年度目标  |Nina    |nina@dev.com |    1|
减脂餐计划 |Paula   |paula@dev.com|    0|

```

## E5 "面试"标签下有多少条提示词
```sql
select count(pt.prompt_id) as prompt_cnt from prompt_tags pt
join tags t on t.id = pt.tag_id
where t.name = '面试';
```
实际输出：

```
prompt_cnt|
----------+
         0|
```

## E6 每个标签的提示词数量，降序，只要数量 ≥ 1 的
```sql
select t.name,count(pt.prompt_id) as prompt_cnt from tags t
join prompt_tags pt on pt.tag_id = t.id
group by t.id
having count(pt.prompt_id) >= 1
order by prompt_cnt desc;
```
实际输出：

```
name|prompt_cnt|
----+----------+
健康  |         5|
创作  |         4|
职场  |         4|

```

## E7 标签数 ≥ 2 的提示词标题和标签数
```sql
select p.title, count(pt.tag_id) as tag_cnt from prompts p
join prompt_tags pt on pt.prompt_id = p.id
group by p.id
having count(pt.tag_id) >= 2
order by tag_cnt desc;
```
实际输出：

```
title |tag_cnt|
------+-------+
体检报告解读|      2|
晨间习惯  |      2|
```

## E8 每个用户最近创建的一条提示词的标题（昵称 + 标题）
```sql
select distinct on (u.id) u.nickname,p.title from users u
join prompts p on p.user_id = u.id
group by u.id,p.id
order by u.id,p.created_at desc;
```
实际输出：

```
nickname|title|
--------+-----+
Nina    |公众号选题|
Oscar   |面试复盘 |
Paula   |睡眠改善 |
Quinn   |手帐排版 |
```

## E9 从未被任何提示词使用的标签名
```sql
select t.name from tags t
left join prompt_tags pt on pt.tag_id = t.id
where pt.prompt_id is null
group by t.id
```

```sql
select t.name from tags t
where not exists (select 1 from prompt_tags pt where pt.tag_id = t.id)
```
实际输出：

```
name|
----+
旅行  |

```

## E10 每个用户的昵称、提示词总数、收藏数，按总数降序
```sql
select u.nickname,count(p.id) as prompt_cnt, count(p.id) filter (where p.is_favorite) as favorite_cnt from users u
left join prompts p on p.user_id = u.id
group by u.id
order by prompt_cnt desc;
```
实际输出：

```
nickname|prompt_cnt|favorite_cnt|
--------+----------+------------+
Paula   |         4|           1|
Nina    |         4|           1|
Quinn   |         2|           1|
Oscar   |         2|           1|
Rosa    |         0|           0|
```

---

## 交卷前自查（口诀三问）

- [ ] 每题想清楚：要"全局 1 行"还是"每 X 一行"？GROUP BY 写的是那个 X
- [ ] "没有 X 的 Y"类题（E3/E9）：LEFT JOIN + IS NULL 或 NOT EXISTS，没用 inner join
- [ ] FROM / JOIN / GROUP BY 三处扫过，"降序/最近"配了 DESC
