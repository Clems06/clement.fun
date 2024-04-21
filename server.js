const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const HTMLParser = require('node-html-parser');


//StackExchange API
const axios = require('axios');
const apiKey = '6up0kZFy2cQuN1nKreBG9g((';
const userId = "15810170";



// Define the paths to your HTML files
const publicDirectoryPath = path.join(__dirname, 'public');
const headPath = path.join(publicDirectoryPath, 'static/head.html');
const headerPath = path.join(publicDirectoryPath, 'static/header.html');
const imagePath = path.join(publicDirectoryPath, 'static/image.html');
const projectPath = path.join(publicDirectoryPath, 'static/projects.html');

var images = fs.readdirSync(__dirname + `/images`)
console.log(images)

// Set up middleware to serve static files
app.use(express.static(publicDirectoryPath));

// Function to read HTML file content
async function readHtmlFile(filePath) {
    try {
        return await fs.promises.readFile(filePath, 'utf8');
    } catch (error) {
        throw new Error(`Error reading ${filePath}: ${error}`);
    }
}

// Define route for the root endpoint
app.get('/', async (req, res) => {
    try {
        // Read the content of both HTML files concurrently


        /*res.write('<body class="d-flex flex-column h-100 text-center text-bg-dark">');
        res.write('<div class="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">');*/
        const [headData, headerData, imageData] = await Promise.all([
            readHtmlFile(headPath),
            readHtmlFile(headerPath),
            readHtmlFile(imagePath)
        ]);

        let ts = Date.now();
        // timestamp in days
        let day_ts = Math.floor(ts / 86400000);
        var image_file = images[day_ts % images.length]
        var image_html = HTMLParser.parse(imageData)
        image_html.querySelector("#image").setAttribute("src","images/"+image_file)

        var header_html = HTMLParser.parse(headerData)
        let active_link = header_html.querySelector("#header-home")
        active_link.classList.add("active")
        active_link.setAttribute("aria-current","page")



        // Combine the content of both HTML files and send as response
        const combinedContent = headData + '<body class="d-flex flex-column h-100 text-center text-bg-dark"><div class="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">' + header_html.toString() + image_html.toString() + '</div><script src="bootstrap/js/bootstrap.bundle.min.js"></script><body>';
        //console.log(combinedContent);
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.send(combinedContent);
        //res.write('</div></body>');*/
    } catch (error) {
        console.error('Error:', error.message);
        error.stack
            .split('\n')
            .slice(1)
            .map(r => r.match(/\((?<file>.*):(?<line>\d+):(?<pos>\d+)\)/))
            .forEach(r => {
                if (r && r.groups && r.groups.file.substr(0, 8) !== 'internal') {
                    const { file, line, pos } = r.groups
                    const f = fs.readFileSync(file, 'utf8').split('\n')
                    console.warn('  ', file, 'at', line + ':' + pos)
                    console.warn('    ', f[line - 1].trim())
                }
            })
        res.status(500).send('Internal Server Error');
    }
});

app.get('/projects', async (req, res) => {
    try {
        // Read the content of both HTML files concurrently


        /*res.write('<body class="d-flex flex-column h-100 text-center text-bg-dark">');
        res.write('<div class="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">');*/
        const [headData, headerData, projectData] = await Promise.all([
            readHtmlFile(headPath),
            readHtmlFile(headerPath),
            readHtmlFile(projectPath)
        ]);

        var header_html = HTMLParser.parse(headerData)
        let active_link = header_html.querySelector("#header-projects")
        active_link.classList.add("active")
        active_link.setAttribute("aria-current", "page")

        var project_html = HTMLParser.parse(projectData);


        //res.write('</div></body>');*/
        let apiUrl = `https://api.stackexchange.com/2.3/users/${userId}?site=stackoverflow&key=${apiKey}&run=true&filter=!*Mg4PjfXdyDn18p.`;
        axios.get(apiUrl)
            .then(response => {
                const userProfile = response.data.items[0];
                console.log('User Profile Information:');
                console.log('Reputation:', userProfile.reputation);
                console.log('Number of Questions:', userProfile.question_count);
                console.log('Number of People Reached:', userProfile.view_count);
                console.log('Number of Answers:', userProfile.answer_count);
                project_html.querySelector("#views>p").set_content(userProfile.view_count.toString());
                project_html.querySelector("#points>p").set_content(userProfile.reputation.toString());
                project_html.querySelector("#answered_questions>p").set_content(userProfile.answer_count.toString());
                project_html.querySelector("#questions>p").set_content(userProfile.question_count.toString());
                const combinedContent = '<body class="d-flex flex-column h-100 text-center text-bg-dark"><div class="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">' + headData + header_html.toString() + project_html.toString() + '</div><script src="bootstrap/js/bootstrap.bundle.min.js"></script><body>';
                res.send(combinedContent);
            })
            .catch(error => {
                console.error('Error fetching user profile:', error);
            });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.use('/images/:image', (req, res, next) => {
    let ts = Date.now();
    let day_ts = Math.floor(ts / 86400000);
    let pos = images.indexOf(req.params.image);
    if (pos != -1) {
        if (pos === day_ts % images.length) {
            next();
        } else {
            res.status(403).send('Forbidden');
        }
    } else {
        // Handle unknown images
        res.status(404).send('Not Found');
    }
});

app.use("/images", express.static(__dirname + "/images"));

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
});