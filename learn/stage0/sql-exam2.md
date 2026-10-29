# SQL 出师考核 · 答题卡

> 规则：90 分钟 · 关 AI · 不看任何答案 · 不查资料
> 每题先在 psql 里跑通，再把 SQL 誊到对应题号下
> 开始时间：10-28 10:30 完成时间：10-28 11:00
## E1 每个用户的昵称和提示词总数
```select u.nickname,count(p.id) as prompt_cnt from users u
   join prompts p on p.user_id = u.id
   group by u.id,u.nickname
   order by prompt_cnt desc;
```
## E2 所有用户的昵称和提示词总数，没有提示词的用户显示 0
```select u.nickname,count(p.id) as prompt_cnt from users u
   left join prompts p on p.user_id = u.id
   group by u.id,u.nickname
   order by prompt_cnt desc;
```
## E3 没有任何提示词的用户昵称
```select u.nickname from users u 
   left join prompts p on p.user_id = u.id
   where p.id is null;
```
## E4 每条提示词的标题、作者 email、标签个数
```select p.title,u.nickname,u.email,count(pt.tag_id) as tag_cnt from prompts p
   left join users u on u.id = p.user_id
   left join prompt_tags pt on pt.prompt_id = p.id
   group by p.id, u.id
   order by tag_cnt desc;
```
## E5 "面试"标签下有多少条提示词
```select count(pt.prompt_id) as prompt_cnt from prompt_tags pt
   join tags t on t.id = pt.tag_id
   group by t.id
   where t.name = '面试';
```
## E6 每个标签的提示词数量，降序，只要数量 ≥ 1 的
```select t.name, count(pt.prompt_id) as prompt_cnt from prompt_tags pt 
   join tags t on t.id = pt.tag_id
   group by t.id
   having count(pt.prompt_id) >= 1
   order by prompt_cnt desc;
```
## E7 标签数 ≥ 2 的提示词标题和标签数
```select p.title, count(pt.tag_id) as tag_cnt from prompts p
   join prompt_tags pt on pt.prompt_id = p.id
   group by p.id,p.title
   having count(pt.tag_id) >= 2
   order by tag_cnt desc;
```
## E8 每个用户最近创建的一条提示词的标题（昵称 + 标题）
```select distinct on(u.id) u.nickname,p.title from users u 
   join prompts p on p.user_id = u.id
   order by u.id,p.created_at desc;
```
## E9 从未被任何提示词使用的标签名
```select t.name from tags t
   join prompt_tags pt on pt.tag_id = t.id
   where pt.prompt_id is null;
```
## E10 每个用户的昵称、提示词总数、收藏数，按总数降序
```select u.nickname, count(p.id) as prompt_cnt, count(p.id) filter (where p.is_favorite) from users u
   left join prompts p on u.id = p.user_id
   group by u.id
   order by prompt_cnt desc;
```