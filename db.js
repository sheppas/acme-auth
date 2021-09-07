const Sequelize = require("sequelize");
const { STRING } = Sequelize;
const config = {
  logging: false,
};
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// secret key, change later
const tokenSecret = process.env.JWT;

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme_db",
  config
);

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});

User.byToken = async (token) => {
  try {
    const verifiedToken = jwt.verify(token, tokenSecret);
    const user = await User.findByPk(verifiedToken.id);
    if (user) {
      return user;
    }
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
      password,
    },
  });
  if (user) {
    const result = await bcrypt.compare(password, user.password)
    console.log("this is the Password", password)
    console.log("this is the hashed password", user.password)
    console.log("this is the result", result)
    if (result) {
      return jwt.sign({ id: user.id }, tokenSecret);
    }
    const error = Error("bad credentials sarah-made");
    error.status = 401;
    throw error;
  }
  const error = Error("bad credentials");
  error.status = 401;
  throw error;
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

User.beforeCreate = (user) => {
  const password = user.password;
  console.log("BANANA")
  user.password = bcrypt.hash(password, 5, function(err, hash){console.log(hash)});
}

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
