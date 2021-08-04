import {Request, Response} from 'express';
import _merge from 'lodash-es/merge';
import {IComponents} from '@steroidsjs/core/providers/ComponentsProvider';
import {initRoutes} from '@steroidsjs/core/actions/router';
import {walkRoutesRecursive} from '@steroidsjs/core/ui/nav/Router/Router';
import {defaultComponents, IApplicationHookConfig} from '@steroidsjs/core/hooks/useApplication';
import {IHistory} from './getHistory';
import {detectLanguage} from '../utils';

export enum ComponentsEnum {
    Locale = 'locale',
    Store = 'store',
    ClientStorage = 'clientStorage',
    Html = 'html',
    Meta = 'meta',
    Ui = 'ui',
    Metrics = 'metrics',
    Http = 'http'
}

interface IComponentConfig {
    [key: string]: any
}

const enrichComponentConfig = (name: string, config: IComponentConfig, data): IComponentConfig => {
    const map = {
        [ComponentsEnum.Store]: {
            reducers: data.appConfig.reducers,
            history: data.history,
        },
        [ComponentsEnum.Locale]: {
            language: detectLanguage(data.req)
        },
        [ComponentsEnum.ClientStorage]: {
            ssrCookie: {
                get: key => data.req.cookies[key],
                set: (key, value, options) => data.res.cookie(key, value, options),
                remove: (key, options) => data.res.clearCookie(key, options)
            }
        },
        [ComponentsEnum.Http]: {
            apiUrl: `${data.req.protocol}://${data.req.get('host')}`
        }
    }

    return {
        ...map[name],
        ...config
    }
}

export const getComponents = (data: {
    req: Request,
    res: Response
    history: IHistory,
    appConfig: IApplicationHookConfig
}): IComponents => {
    const componentsConfig = _merge({}, defaultComponents, data.appConfig.components);

    return Object.entries(componentsConfig).reduce((acc, [name, value]): IComponents => {
        if (typeof value === 'function') {
            componentsConfig[name] = {className: value};
        }

        const {className, ...componentConfig} = componentsConfig[name];

        acc[name] = new className(acc, enrichComponentConfig(name, componentConfig, data));

        return acc;
    }, {});
}

export const initComponents = (components: IComponents, data: {appConfig: IApplicationHookConfig}) => {
    if (data.appConfig.onInit) {
        data.appConfig.onInit(components);
    }

    const map = {
        [ComponentsEnum.Store]: () => {
            const toDispatch = [
                {type: '@@redux/INIT'},
                initRoutes(
                    walkRoutesRecursive({id: 'root', ...data.appConfig.routes()}),
                ),
            ]
            components.store.dispatch(toDispatch);
        },
        [ComponentsEnum.Http]: () => {
            const accessToken = components.clientStorage.get(components.http.accessTokenKey, components.clientStorage.STORAGE_COOKIE);
            if (accessToken) {
                components.http.setAccessToken(accessToken);
            }
        }
    }

    Object.keys(components).forEach(name => {
        const init = map[name];
        if (init) {
            init();
        }
    })
}
