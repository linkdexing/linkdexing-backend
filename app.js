require("dotenv/config");

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const logger = require("./config/winston");

const mongoose = require("mongoose");

const app = express();

const port = process.env.PORT || 4000;

app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
logger.stream = {
  write: function (message, encoding) {
    logger.info(message);
  },
};

app.use(morgan("combined", { stream: logger.stream }));

app.use("/api/v1/users", require("./src/api/v1/users/routes"));
app.use("/api/v1/orders", require("./src/api/v1/orders/routes"));
app.use("/api/v1/admin", require("./src/api/v1/admin/routes"));
app.use("/api/v1/userVariables", require("./src/api/v1/userVariables/routes"));

// Errors are shown in error.log
// Both success and error are shown in access.log
app.use((err, req, res, next) => {
  if (res.statusCode === 200) {
    res.status(500);
  }
  logger.error(
    `${req.method} - ${err.message} - ${JSON.stringify(err.stack)} - ${
      req.originalUrl
    } - ${req.ip}`
  );
  return next(err);
});

app.use((err, req, res, next) => {
  if (res.statusCode === 200) {
    res.status(500);
  }

  return res.json({
    ok: false,
    message: err.message || "Something went wrong",
  });
});

mongoose.connect(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.men9r.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,  
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("DB Connected");
    }
  }
);

app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});
