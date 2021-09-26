const process = require("process")
const Koa = require("koa");
const KoaBody = require("koa-body");
const Router = require("@koa/router");
const jwt = require("koa-jwt");
const jsonwebtoken = require("jsonwebtoken");
const crypto = require("crypto");

const { Sequelize, Model, DataTypes } = require("sequelize");

const app = new Koa();
const router = new Router();

const args = process.argv.slice(2);

/**
 * 初始化数据库连接
 */
const sequelize = new Sequelize("uncode", "root", args[1], {
  host: args[0],
  dialect: "mysql",
  pool: {
    max: 50,
    min: 0,
    idle: 10000,
  },
  timezone: "+08:00", //东八时区
});

/**
 * 用户表（类）
 */
class User extends Model {}

User.init(
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [5, 10],
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        min: 6,
      },
    },
  },
  {
    sequelize,
    modelName: "User",
    paranoid: true,
  }
);
/**
 * 文章表（类）
 */
class Article extends Model {}

Article.init(
  {
    id: {
      //文章id
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      //文章标题
      type: DataTypes.STRING(64),
      allowNull: false,
      validate: {
        max: 23,
        min: 1,
        notEmpty: true,
      },
    },
    desc: {
      //文章简介
      type: DataTypes.STRING,
      allowNull: true,
    },
    banner: {
      //文章banner
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    time: {
      //文章创建时间
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true,
        customValidator(value) {
          if (!value) {
            this.value = this.createdAt;
          }
        },
      },
    },
    category: {
      //归类
      type: DataTypes.STRING,
      allowNull: false,
    },
    tag: {
      //标签
      type: DataTypes.STRING,
      allowNull: false,
    },
    detail: {
      //文章详情
      type: DataTypes.TEXT,
      allowNul: false,
    },
    view: {
      //浏览量
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    sequelize, //实例
    modelName: "Article", // 模型名称
    paranoid: true, //软删除
  }
);

(async () => {
  await sequelize.sync({ force: false });
})();

app.use(KoaBody()); //添加body parse

/**
 * API
 */

/**
 * @description: 查询所有文章列表
 * @param {*}
 * @return {*}
 */
router.post("/uncode/api/posts", async (ctx) => {
  try {
    const params = ctx.request.body;
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const { count, rows: posts } = await Article.findAndCountAll({
      offset: (page - 1) * 10,
      limit: pageSize,
    });
    ctx.status = 200;
    ctx.body = {
      code: 1,
      data: {
        posts,
        page,
        pageSize,
        count,
      },
      msg: "查询成功！",
    };
  } catch (err) {
    ctx.status = 200;
    ctx.body = {
      code: 0,
      msg: err.message,
    };
  }
});

/**
 * @description: 查询所有分类
 * @param {*}
 * @return {*}
 */
router.get("/uncode/api/categories", async (ctx) => {
  try {
    const categories = await Article.findAll({
      attributes: [
        "category",
        [sequelize.fn("COUNT", sequelize.col("category")), "num"],
      ],
      group: "category",
    });
    ctx.status = 200;
    ctx.body = {
      code: 1,
      data: {
        categories,
      },
      msg: "查询成功！",
    };
  } catch (err) {
    ctx.status = 200;
    ctx.body = {
      code: 0,
      msg: err.message,
    };
  }
});

/**
 * @description: 查询所有标签
 * @param {*}
 * @return {*}
 */
router.get("/uncode/api/tags", async (ctx) => {
  try {
    const tags = await Article.findAll({
      attributes: ["tag", [sequelize.fn("COUNT", sequelize.col("tag")), "num"]],
      group: "tag",
    });
    ctx.status = 200;
    ctx.body = {
      code: 1,
      data: {
        tags,
      },
      msg: "查询成功！",
    };
  } catch (err) {
    ctx.status = 200;
    ctx.body = {
      code: 0,
      msg: err,
    };
  }
});

/**
 * @description: 查询文章详情
 * @param {*}
 * @return {*}
 */
router.get("/uncode/api/content/:id", async (ctx) => {
  try {
    if (ctx.params.id) {
      const article = await Article.findOne({
        where: {
          id: ctx.params.id,
        },
      });
      ctx.status = 200;
      ctx.body = {
        code: 1,
        data: article,
        msg: "获取成功！",
      };
    } else {
      throw new Error("请传入文章id！");
    }
  } catch (err) {
    ctx.status = 200;
    ctx.body = {
      code: 0,
      msg: err.message || "获取失败！",
    };
  }
});

/**
 * @description: 根据分类查询文章列表
 * @param {*}
 * @return {*}
 */
router.post("/uncode/api/category", async (ctx) => {
  try {
    console.log(ctx.request.body);
    const params = ctx.request.body;
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const category = params.category || "";
    if (category === "") {
      throw new Error("请传入分类！");
    }
    const { count, rows: posts } = await Article.findAndCountAll({
      where: {
        category,
      },
      offset: (page - 1) * 10,
      limit: pageSize,
    });
    ctx.status = 200;
    ctx.body = {
      code: 1,
      data: {
        posts,
        count,
        page,
        pageSize,
      },
      msg: "获取成功！",
    };
  } catch (err) {
    ctx.status = 200;
    ctx.body = {
      code: 0,
      msg: err.message || "获取失败！",
    };
  }
});

/**
 * @description: 根据标签查询文章列表
 * @param {*}
 * @return {*}
 */
router.post("/uncode/api/tag", async (ctx) => {
  try {
    console.log(ctx.request.body);
    const params = ctx.request.body;
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const tag = params.tag || "";
    if (tag === "") {
      throw new Error("请传入标签！");
    }
    const { count, rows: posts } = await Article.findAndCountAll({
      where: {
        tag,
      },
      offset: (page - 1) * 10,
      limit: pageSize,
    });
    ctx.status = 200;
    ctx.body = {
      code: 1,
      data: {
        posts,
        count,
        page,
        pageSize,
      },
      msg: "获取成功！",
    };
  } catch (err) {
    ctx.status = 200;
    ctx.body = {
      code: 0,
      msg: err.message || "获取失败！",
    };
  }
});

/**
 * @description: 查询文章归档列表
 * @param {*}
 * @return {*}
 */
router.get("/uncode/api/archive", async (ctx) => {
  try {
    const archive = await Article.findAll({
      order: sequelize.literal("max(createdAt) DESC"),
      group: "id",
    });
    ctx.status = 200;
    ctx.body = {
      code: 1,
      data: archive,
      msg: "获取成功！",
    };
  } catch (err) {
    ctx.status = 200;
    ctx.body = {
      code: 0,
      msg: err.message || "获取失败！",
    };
  }
});

/**
 * @description: 注册接口
 * @param {*}
 * @return {*}
 */
router.post("/uncode/api/register", async (ctx) => {
  const { body } = ctx.request;
  try {
    if (!body.username || !body.password) {
      throw new Error("请输入用户名或密码！");
    }
    const pwd = crypto.createHash("md5").update(body.password).digest("hex");
    const [user, created] = await User.findOrCreate({
      where: {
        username: body.username,
      },
      defaults: {
        password: pwd,
      },
    });
    if (!created) {
      throw new Error("此用户名已被使用！");
    }
    const token = jsonwebtoken.sign(
      { user: user.name, id: user.id },
      "uncode-server-secret",
      { expiresIn: "24h" }
    );
    ctx.status = 200;
    ctx.body = {
      code: 1,
      data: {
        token,
        userInfo: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt,
        },
      },
      msg: "注册成功！",
    };
  } catch (err) {
    ctx.status = 200;
    ctx.body = {
      code: 0,
      msg: err.message,
    };
  }
});

/**
 * @description: 登录接口
 * @param {*}
 * @return {*}
 */
router.post("/uncode/api/login", async (ctx) => {
  const { body } = ctx.request;
  try {
    if (!body.username || !body.password) {
      throw new Error("请输入用户名或密码！");
    }
    const pwd = crypto.createHash("md5").update(body.password).digest("hex");
    const user = await User.findOne({
      where: {
        username: body.username,
      },
    });
    if (user === null) {
      throw new Error("此用户名未注册！");
    }
    if (pwd === user.password) {
      const token = jsonwebtoken.sign(
        { user: user.name, id: user.id },
        "uncode-server-secret",
        { expiresIn: "24h" }
      );
      ctx.status = 200;
      ctx.body = {
        code: 1,
        data: {
          token,
          userInfo: {
            id: user.id,
            username: user.username,
            createdAt: user.createdAt,
          },
        },
        msg: "登录成功！",
      };
    } else {
      throw new Error("密码错误！");
    }
  } catch (err) {
    ctx.status = 200;
    ctx.body = {
      code: 0,
      msg: err.message,
    };
  }
});

app.use(
  jwt({ secret: "uncode-server-secret" }).unless({ path: [/^\/uncode/] })
);

/**
 * @description: 新增文章
 * @param {*}
 * @return {*}
 */
router.post("/private/uncode/api/post", async (ctx) => {
  try {
    await Article.create({ ...ctx.request.body });
    ctx.status = 200;
    ctx.body = {
      code: 1,
      msg: "新增成功！",
    };
  } catch (err) {
    ctx.status = 200;
    ctx.body = {
      code: 0,
      msg: err.message,
    };
  }
});

/**
 * @description: 修改文章
 * @param {*}
 * @return {*}
 */
router.post("/private/uncode/api/edit", async (ctx) => {
  try {
    await Article.update(
      { ...ctx.request.body },
      {
        where: {
          id: ctx.request.body.id,
        },
      }
    );
    ctx.status = 200;
    ctx.body = {
      code: 1,
      msg: "编辑成功！",
    };
  } catch (err) {
    ctx.status = 200;
    ctx.body = {
      code: 0,
      msg: err.message,
    };
  }
});

/**
 * @description: 删除文章
 * @param {*}
 * @return {*}
 */
router.delete("/private/uncode/api/deletePost/:id", async (ctx) => {
  try {
    const res = await Article.destroy({
      where: {
        id: ctx.params.id,
      },
    });
    ctx.status = 200;
    if (res) {
      ctx.body = {
        code: 1,
        msg: "删除成功！",
      };
    } else {
      throw new Error("未找到此文章！");
    }
  } catch ({ message }) {
    ctx.status = 200;
    ctx.body = {
      code: 0,
      msg: message,
    };
  }
});

app.use(function (ctx, next) {
  return next().catch((err) => {
    if (err.status === 401) {
      ctx.status = 401;
      ctx.body = {
        error: err.originalError ? err.originalError.message : err.message,
      };
    } else {
      throw err;
    }
  });
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3001, () => {
  console.log(`server is running on port 3001`);
});
