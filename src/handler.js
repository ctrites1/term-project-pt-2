const { parse } = require("url");
const { DEFAULT_HEADER } = require("./util/util.js");
const controller = require("./controller");
const fs = require("fs/promises");

// GET - sends html back to the browser => when you type something in the url bar
/*
  Triggers 2 ways:
  1. type into url
  2. links <== Users will do this, not type in url bar
 */
// POST - should NOT send to browser -> browser should send to server => 
const allRoutes = {
  // GET: localhost:3000/form
  "/form:get": (request, response) => {
    controller.getFormPage(request, response);
  },
  // POST: localhost:3000/form
  "/form:post": (request, response) => {
    controller.uploadImages(request, response);
  },
  // GET: localhost:3000/feed
  // Shows instagram profile for a given user
  "/feed:get": (request, response) => {
    controller.getFeed(request, response);
  },

  default: async (req, res) => {
    if (req.url === "/") {
      controller.getFormPage(req, res);
      return;

    }
    console.log(req.url);
    await fs.readFile(__dirname + req.url).then((data) => {
      
      res.writeHead(200, DEFAULT_HEADER); //"Content-Type: image/jpeg"
      res.end(data);

    }).catch((err) => {res.writeHead(404, DEFAULT_HEADER);
        res.end("404 not found");});
    return;
    // controller.getFormPage(request, response);
    // response.writeHead(404, DEFAULT_HEADER);
    // createReadStream(path.join(__dirname, "views", "404.html"), "utf8").pipe(
    //   response
    // );
  },
};

function handler(request, response) {
  const { url, method } = request;

  const { pathname } = parse(url, true);

  const key = `${pathname}:${method.toLowerCase()}`;
  const chosen = allRoutes[key] || allRoutes.default;

  return Promise.resolve(chosen(request, response)).catch(
    handlerError(response)
  );
}

function handlerError(response) {
  return (error) => {
    console.log("Something bad has  happened**", error.stack);
    response.writeHead(500, DEFAULT_HEADER);
    response.write(
      JSON.stringify({
        error: "internet server error!!",
      })
    );

    return response.end();
  };
}

module.exports = handler;
