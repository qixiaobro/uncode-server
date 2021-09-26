
# uncode-server
使用以下技术栈实现的个人简单博客后端服务。目前处于1.0.0开发阶段，主要用来实践学习的几项技术，暂时不考虑controller、server等架构设计。

1. `koa2` ：服务端框架
2. `@koa-router` ：路由
3. `koa-body` ：解析body
4. `Sequelize` ：Node.js ORM，连接和操作数据库
5. `koa-jwt` ：权限校验
6. `koa-redis`：缓存服务
6. `winston`: 记录日志

TODO:  
- [x]  定义数据库表模型
- [x]  实现登录接口
- [x]  实现文章上传接口  
- [x]  实现文章编辑/删除接口  
- [x]  实现查询文章列表接口  
- [x]  实现查询文章详情接口  
- [x]  实现查询文章分类接口  
- [x]  实现查询文章标签接口  
- [x]  实现查询文章归档接口
- [x]  rollup 打包


