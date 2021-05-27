import express from 'express';
import compression from 'compression';
import {join} from 'path';
import render from './middlewares/render';

const port = process.env.APP_SSR_PORT;
const host = process.env.APP_SSR_HOST;
const app = express();

app
    .disable('x-powered-by')
    .enable('trust proxy')
    .use(compression())
    .use(express.static(join(process.env.APP_SSR_OUTPUT_PATH)))
    .use(render);

app.get('*', (req, res) => {
    const accessTokenMatch = (req.headers.cookie || '').match(/accessToken\s*=\s*(\w+)/);
    const accessToken = accessTokenMatch && accessTokenMatch[1] || null;
    //res.writeHead(200, {'Content-Type': 'text/html'});
    res.renderBundle();
});

app.listen(port, host, (err) => {
    if (err) {
        console.error(err)
    } else {
        console.log(`Listening at http://${host}:${port}`);
    }
})
