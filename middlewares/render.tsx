import * as React from 'react';
import {renderToStaticMarkup, renderToString} from 'react-dom/server';
import {NextFunction, Request, Response} from 'express';
import {StaticRouterContext} from 'react-router';
import {Helmet, HelmetData} from 'react-helmet';
import {ComponentsProvider, SsrProvider} from '@steroidsjs/core/providers';
import {
    getComponents,
    initComponents,
    getHistory,
    getAssets,
    getPreloadedFetchesData,
    initApplication,
    initLists
} from '../utils';
import {IPreloadedData} from '@steroidsjs/core/providers/SsrProvider';
import {getPreloadConfigs} from '../utils/getPreloadedData';

export interface ResponseWithRender extends Response {
    renderBundle: () => void;
}

interface IHTMLParams {
    bundleHTML: string,
    helmet: HelmetData,
    store: any,
    preloadedData: IPreloadedData
}

const getHTML = ({bundleHTML, store, helmet, preloadedData}: IHTMLParams): string => {
    const stats = getAssets(require('_SsrStats'));

    const html = renderToStaticMarkup(
        <html>
            <head>
                <meta charSet='utf-8'/>
                <meta name='viewport' content='width=device-width, initial-scale=1'/>
                {['base', 'title', 'meta', 'link', 'style', 'script'].map(tagName => (
                    <React.Fragment key={tagName}>
                        {helmet[tagName].toComponent()}
                    </React.Fragment>
                ))}
                {stats.css.map((path, index) => (
                    <link key={index} href={`/${path}`} rel='stylesheet'/>
                ))}
            </head>
            <body>
                <noscript>You need to enable JavaScript to run this app.</noscript>
                {helmet.noscript.toComponent()}
                <div id='root' dangerouslySetInnerHTML={{__html: bundleHTML}}/>
                <script dangerouslySetInnerHTML={{
                    __html: `window.APP_REDUX_PRELOAD_STATES = ${JSON.stringify([store])};
                        window.APP_PRELOADED_DATA=${JSON.stringify(preloadedData)}`
                }}/>
                {stats.js.map((path, index) => (
                    <script key={index} src={`/${path}`}/>
                ))}
            </body>
        </html>
    );

    return `<!doctype html>${html}`;
};

export default (req: Request, res: ResponseWithRender, next: NextFunction) => {
    res.renderBundle = async () => {
        const {default: Application, config: appConfig} = require('_SsrApplication');
        if (!appConfig) {
            throw new Error(`Please save application's config in variable and export it from _SsrApplication`);
        }

        // Application init
        const history = getHistory(req.url);

        const components = getComponents({appConfig, req, res, history});
        initComponents(components, {appConfig});

        await initApplication(components);

        // Preload lists and fetches, get fetches data
        const {fetchConfigs, listsConfigs} = getPreloadConfigs(appConfig.routes(), req.path);
        let preloadedData = {} as IPreloadedData;
        try {
            await initLists(listsConfigs, components);
            preloadedData = await getPreloadedFetchesData(fetchConfigs, components);
        } catch (err) {
            console.error(err);
        }

        // Render application to string
        const context: StaticRouterContext = {};

        const bundleHTML = renderToString(
            <SsrProvider
                history={history}
                staticContext={context}
                preloadedData={preloadedData}
            >
                <ComponentsProvider components={components}>
                    <Application/>
                </ComponentsProvider>
            </SsrProvider>
        );

        if (context.url) {
            res.redirect(context.url);
            return;
        }

        // Render resulting HTML to string
        const html = getHTML({
            helmet: Helmet.rewind(),
            bundleHTML,
            store: components.store.getState(),
            preloadedData
        });

        res
            .status(context.statusCode || 200)
            .send(html);
    }

    next();
}

