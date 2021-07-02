import {Request, Response} from 'express';
import {IComponents} from '@steroidsjs/core/providers/ComponentsProvider';
import {defaultComponents} from '@steroidsjs/core/hooks/useApplication';
import {IHistory} from './getHistory';
import {detectLanguage} from '../utils';

export enum ComponentsEnum {
    Locale = 'locale',
    Store = 'store',
    ClientStorage = 'clientStorage',
    Html = 'html',
    Meta = 'meta',
    Ui = 'ui',
    Metrics = 'metrics'
}

interface IComponentData {
    req: Request,
    res: Response
    history: IHistory
}

const enrichComponentConfig = (name: string, config: Record<string, any>, data: IComponentData) => {
    const map = {
        [ComponentsEnum.Store]: () => {
            config.reducers = require('reducers').default;
            config.history = data.history;
        },
        [ComponentsEnum.Locale]: () => {
            config.language = detectLanguage(data.req);
        },
        [ComponentsEnum.ClientStorage]: () => {
            config.ssrCookie = {
                get: key => data.req.cookies[key],
                set: (key, value, options) => data.res.cookie(key, value, options),
                remove: (key, options) => data.res.clearCookie(key, options)
            }
        }
    }

    const getResult = map[name];
    if (getResult) {
        getResult();
    }
}

const getComponents = (appConfig: Record<string, any>, data: IComponentData): IComponents => {
    const componentsConfig = {
        ...defaultComponents,
        ...appConfig.components,
    };

    const result = Object.entries(componentsConfig).reduce((acc, [name, value]): IComponents => {
        if (typeof value === 'function') {
            componentsConfig[name] = {className: value};
        }

        const {className, ...componentConfig} = componentsConfig[name];

        enrichComponentConfig(name, componentConfig, data);

        acc[name] = new className(acc, componentConfig);

        return acc;
    }, {});

    if (appConfig.onInit) {
        appConfig.onInit(result);
    }

    return result;
}

export default getComponents;
