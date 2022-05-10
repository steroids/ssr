import express, {Request} from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import {join} from 'path';
import render, {ResponseWithRender} from './middlewares/render';
const url = require('url');
const proxy = require('express-http-proxy');

const port = Number(process.env.APP_SSR_PORT);
const host = process.env.APP_SSR_HOST;
const app = express();

app
    .disable('x-powered-by')
    .enable('trust proxy')
    .use(cookieParser());

if (process.env.APP_PROXY_BACKEND) {
    // Source: https://stackoverflow.com/a/32756976/911350
    app.use(
        ['/api/*', '/files/*'],
        proxy(
            process.env.APP_BACKEND_URL,
            {proxyReqPathResolver: req => url.parse(req.baseUrl).path},
        ),
    );
}

app
    .use(compression())
    .use(express.static(join(process.env.APP_SSR_OUTPUT_PATH)))
    .use(render);

app.get('*', async (req: Request, res: ResponseWithRender) => {
    await res.renderBundle();
});

// @ts-ignore
app.listen(port, host, (err) => {
    if (err) {
        console.error(err)
    } else {
        console.log(`Listening at http://${host}:${port}`);
    }
})
