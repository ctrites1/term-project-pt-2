/* ------------------------ Packages, Modules, Etc ~ ------------------------ */
const fs = require("fs/promises");
const { DEFAULT_HEADER } = require("./util/util");
const path = require("path");
const qs = require("querystring");
const { EOL } = require("os");
const formidable = require("formidable");
const ejs = require("ejs");
/* ---------------------------------- Notes --------------------------------- */
// Get requests: typing in url bar OR clicking a link
// "/feed?KEY=VALUE" => Query String

// getSomePage: (request, response) => {
//     const data = loadSomeData(); // loading data into function to use, not nec a function
//     const htmlTemplate = await fs.readFile(path.join(__dirname, "views", "somePage.html"), "utf-8");
//     const html = ejs.render(htmlTemplate, data);
//     response.end(html);
// }
/* ------------------------------- Actual Code ------------------------------ */
const controller = {
    getFormPage: async (request, response) => {
        
        const userDataPath = path.join(path.dirname(__dirname), "database/data.json");

        let userArray = []; // array of all users from data.json
        let divList = []; // list of all htmlDiv blocks from each user
        let homepageBody = ""; // above list of divs as a single string

        await fs.readFile(userDataPath, "utf-8")
        .then((dataArray) => JSON.parse(dataArray).forEach((userObj) => userArray.push(userObj.username)))
        .then(() => userArray.forEach((name) => 
        divList.push(`
        <form action="/form" method="post" enctype="multipart/form-data" id="formID" >
        <div>
            <input type="file" name="file" />
            <input type="hidden" name="user" value="${name}" />
            <a href="/feed?user=${name}">${name} FEED</a>
        </div>
    
        <div class="button">
            <button type="submit">Upload Photo</button>
        </div>
        </form>`)))
        .then(() => (homepageBody = divList.join(EOL)))
        .catch((err) => console.log(err))
        
        const homepageTop = (`
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Homepage</title>
            <link rel="stylesheet" href="/views/homepageStyle.css">
        </head>
        <body>
            <h1>Users</h1>
        `);
        
        const homepageBottom = (`
        </body>
        </html>
        `);
    
    return response.end(homepageTop.concat(EOL, homepageBody, EOL, homepageBottom))
  }, // getFormPage

  uploadImages: async (req, res) => {
    const userDataPath = path.join(path.dirname(__dirname), "database/data.json");
    let userData = JSON.parse(await fs.readFile(userDataPath, "utf-8"));

    const form = new formidable.IncomingForm({ // Set form
        keepExtensions: true,
        maxFiles: 1,
        uploadDir: path.join(__dirname, "uploads"),
    });

    let fields, files;
    try {
        [fields, files] = await form.parse(req); // Parse form
    } catch (err) { // Error handling
        console.error(err);
        res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' });
        res.end(String(err));
        return;
    }
    // index = 0 b/c maxFiles = 1
    const user = fields.user[0];
    const fileName = files.file[0].originalFilename;
    // Move file from uploads to user's photo folder
    await fs.rename(files.file[0].filepath, path.join(__dirname, "photos", user, fileName));
    // it's all g bruh coolcool
    res.writeHead(200);
    res.end("Uploaded " + fileName + " to " + user + "'s photos folder");
    // res.end(JSON.stringify({ fields, files }, null, 2));

    userData.forEach((userObj) => {
        if (userObj.username === user) {
            userObj.photos.push(fileName);
        };
    });
    // overwrite data.json with new data whoa neato
    await fs.writeFile(userDataPath, JSON.stringify(userData, null, 2), (err) => {
        if (err) throw err;
    });

    return;
  }, // uploadImages

  getFeed: async (req, res) => {
    const user = qs.parse(req.url.split("?")[1]).user; // get user from qs
    // Read in the goddamn data.json file
    const userDataPath = path.join(path.dirname(__dirname), "database/data.json");
    const feedUserData = JSON.parse(await fs.readFile(userDataPath, "utf-8"))
                                .filter((userObj) => userObj.username === user)[0];
                                // returns the user's data whose feed was selected
    const template = await fs.readFile(path.join(__dirname, "views/feedPage-template.ejs"), "utf-8")
    const html = ejs.render(template, {feedUserData: feedUserData});
    res.end(html);
    return;
  },
};

module.exports = controller;
