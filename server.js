const { syncAndSeed } = require("./db");
const app = require("./app");

const init = async () => {
  try {
    await syncAndSeed();
    const port = process.env.PORT || 8080;
    app.listen(port, () => console.log(`listening on port ${port}`));
  } catch (error) {
    console.log(error);
  }
};

init();
