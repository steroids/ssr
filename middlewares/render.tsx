import * as React from 'react';
import {renderToString} from 'react-dom/server';
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
import {IApplicationHookConfig} from '@steroidsjs/core/hooks/useApplication';

export interface ResponseWithRender extends Response {
    renderBundle: () => void;
}

interface IHTMLParams {
    bundleHTML: string,
    helmet: HelmetData,
    store: any,
    preloadedData: IPreloadedData
}

export const API_ID_CUSTOM_CODE_FETCH = 'api_id_custom_code_fetch';
export type ICustomCodeFetchResult = {
    head?: string,
    bodyStart?: string,
    bodyEnd?: string,
};

const compileHtmlDocument = ({bundleHTML, store, helmet, preloadedData}: IHTMLParams): string => {
    const stats = getAssets(require('_SsrStats'));

    const isCustomCodeFetched = API_ID_CUSTOM_CODE_FETCH in preloadedData;
    const customCodePreloadData: ICustomCodeFetchResult = isCustomCodeFetched
        ? preloadedData[API_ID_CUSTOM_CODE_FETCH]
        : {};

    const headCustomCode = customCodePreloadData.head || '';
    const bodyStartCustomCode = customCodePreloadData.bodyStart || '';
    const bodyEndCustomCode = customCodePreloadData.bodyEnd || '';

    if (isCustomCodeFetched) {
        preloadedData[API_ID_CUSTOM_CODE_FETCH] = undefined
    }

    return `
<!doctype html>
<html>
<head>
    <meta charSet='utf-8'/>
    <meta name='viewport' content='width=device-width, initial-scale=1'/>
    ${['base', 'title', 'meta', 'link', 'style', 'script'].map(tagName => helmet[tagName].toString()).join('')}
    ${stats.css.map(path => `<link href='/${path}' rel='stylesheet'/>`).join('')}
    ${headCustomCode}
</head>
<body>
    ${bodyStartCustomCode}
    <noscript>You need to enable JavaScript to run this app.</noscript>
    ${helmet.noscript.toString()}
    <div id='root'>${bundleHTML}</div>
    <script>
        window.APP_REDUX_PRELOAD_STATES = ${JSON.stringify([store])};
        window.APP_PRELOADED_DATA = ${JSON.stringify(preloadedData)}
    </script>
    ${stats.js.map(path => `<script src='/${path}'></script>`).join('')}
    ${bodyEndCustomCode}
</body>
</html>`;
};

export default (req: Request, res: ResponseWithRender, next: NextFunction) => {
    res.renderBundle = async () => {
        const {default: Application, config} = require('_SsrApplication');
        const appConfig = config as unknown as IApplicationHookConfig;
        if (!appConfig) {
            throw new Error(`Please save application's config in variable and export it from _SsrApplication`);
        }

        // Application init
        const history = getHistory(req.url);

        const components = getComponents({appConfig, req, res, history});
        initComponents(components, {appConfig});

        await initApplication(components);

        // Preload lists and fetches, get fetches data
        const {routeFetchConfigs, routeListsConfigs} = getPreloadConfigs(appConfig.routes(), req.path);
        let preloadedData = {} as IPreloadedData;
        try {
            await initLists(routeListsConfigs, components);
            const defaultFetchConfigs = appConfig.defaultFetches || [];
            const fetchConfigs = [...routeFetchConfigs, ...defaultFetchConfigs];
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
        const html = compileHtmlDocument({
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

