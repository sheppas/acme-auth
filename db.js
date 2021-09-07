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

const Note = conn.define("note", {
  text: STRING,
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
      // password,
    },
  });

  if (user) {
    const result = await bcrypt.compare(password, user.password);
    // console.log("this is the Password", password);
    // console.log("this is the hashed password", user.password);
    // console.log("this is the result", result);
    if (result) {
      return jwt.sign({ id: user.id }, tokenSecret);
    }
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
  const notes = [
    { text: "hello world" },
    { text: "bananas are good" },
    { text: "bananas is bad" },
  ];
  const [text1, text2, text3] = await Promise.all(
    notes.map((note) => Note.create(note))
  );
  await lucy.setNotes(text1);
  await moe.setNotes(text2);
  await larry.setNotes(text3);

  return {
    users: {
      lucy,
      moe,
      larry,
    },
    notes: {
      text1,
      text2,
      text3,
    },
  };
};

User.beforeCreate(async (user) => {
  try {
    const password = user.password;
    user.password = await bcrypt.hash(password, 5);
  } catch (error) {
    console.log(error);
  }
});

Note.belongsTo(User);
User.hasMany(Note);

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note,
  },
};
