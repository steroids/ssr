import {Request} from 'express';
import {matchPath} from 'react-router-dom';
import {IRouteItem} from '@steroidsjs/core/ui/nav/Router/Router';
import {treeToList} from '@steroidsjs/core/ui/nav/Router/helpers';
import {IListProps} from '@steroidsjs/core/ui/list/List/List'
import {IComponents} from '@steroidsjs/core/providers/ComponentsProvider';
import {getConfigId, normalizeConfig, fetchData, IFetchConfig} from '@steroidsjs/core/hooks/useFetch';

export interface IPreloadedFetchResult {
    data: Record<string, any>;
    errors: Record<string, ReturnType<typeof normalizeError>>;
}

const addCancelTokenMock = () => {}

const getRoutePreloadData = (routesTree: IRouteItem, path: Request['path']): (IFetchConfig | IListProps)[] => {
    for (const route of treeToList(routesTree)) {
        const matchResult = matchPath(path, route);
        if (matchResult) {
            return route.preloadData
                ? route.preloadData(matchResult)
                : [];
        }
    }

    return [];
};

export const getPreloadConfigs = (routesTree: IRouteItem, path: Request['path']): {routeFetchConfigs: IFetchConfig[], routeListsConfigs: IListProps[]} => {
    const fetchConfigs = [];
    const listsConfigs = [];

    const routePreloadData = getRoutePreloadData(routesTree, path);

    routePreloadData.forEach(config => {
        if ('listId' in config) {
            listsConfigs.push(config);
        } else {
            fetchConfigs.push(config);
        }
    });

    return {
        routeFetchConfigs: fetchConfigs,
        routeListsConfigs: listsConfigs,
    };
}

const normalizeError = (error: unknown) => {
    if ((error as any)?.isAxiosError) {
        const axiosError = error as any;

        return {
            isAxiosError: true,
            response: {
                data: axiosError.response?.data,
                status: axiosError.response?.status,
                statusText: axiosError.response?.data,
                headers: axiosError.response?.headers,
                config: axiosError.response?.config,
            },
            code: axiosError?.code,
            message: axiosError?.message,
        };
    }

    if (error instanceof Error) {
        return {
            isAxiosError: false,
            message: error.message,
        };
    }

    return {
        isAxiosError: false,
        message: String(error),
    };
};

const getPreloadedFetchesData = async (
    fetchConfigs: IFetchConfig[],
    components: IComponents
): Promise<IPreloadedFetchResult> => {
    const fetchPromises = fetchConfigs
        .map(normalizeConfig)
        .map(config =>
            fetchData(config, components, addCancelTokenMock)
                .then(data => ({
                    ok: true as const,
                    data,
                    config
                }))
                .catch(error => ({
                    ok: false as const,
                    error: normalizeError(error),
                    config
                }))
        );

    const results = await Promise.all(fetchPromises);

    return results.reduce<IPreloadedFetchResult>(
        (acc, result) => {
            const configId = getConfigId(result.config);

            if (result.ok) {
                acc.data[configId] = result.data;
            } else {
                // Если fetch не критический — кладём в errors, но не ломаем статус
                acc.errors[configId] = {
                    ...result.error,
                    isCritical: result.config.isCritical ?? true,
                };
            }

            return acc;
        },
        {
            data: {},
            errors: {},
        }
    );
};


export default getPreloadedFetchesData;
